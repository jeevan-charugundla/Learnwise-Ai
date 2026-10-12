"""
GroqService — wraps Groq SDK (primary) and legacy httpx LLM calls (fallback).

Security notes:
  - groq_api_key is NEVER logged.
  - correct_answer is stripped from questions returned to API callers.
  - Full questions (with correct_answer) are returned separately for server-side storage.
"""

import asyncio
import json
import logging
import re

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Demo / fallback question bank (mirrors questions.py BANK)
# ---------------------------------------------------------------------------

_BANK: dict[str, list[dict]] = {
    "Projectile Motion": [
        {
            "question": "A projectile is launched at 20 m/s at 30° above horizontal. "
                        "Take g = 10 m/s². What is its time to reach maximum height?",
            "options": ["0.5 s", "1.0 s", "1.5 s", "2.0 s"],
            "correct_answer": "1.0 s",
            "solution": "At maximum height vertical velocity is zero. "
                        "Initial vertical velocity is 20 sin 30° = 10 m/s, "
                        "so t = u_y/g = 1 s.",
            "difficulty": "medium",
            "concept": "Vertical velocity component",
        },
        {
            "question": "A projectile has initial speed u at angle θ. Neglecting air "
                        "resistance, which quantity remains constant during flight?",
            "options": [
                "Vertical velocity",
                "Horizontal velocity",
                "Speed",
                "Vertical displacement",
            ],
            "correct_answer": "Horizontal velocity",
            "solution": "Gravity acts vertically, so horizontal acceleration is zero "
                        "and horizontal velocity remains constant.",
            "difficulty": "easy",
            "concept": "Independent horizontal and vertical motion",
        },
        {
            "question": "A projectile is launched at 20 m/s at 30° above horizontal. "
                        "Take g = 10 m/s². Its total time of flight on level ground is:",
            "options": ["1 s", "2 s", "√3 s", "4 s"],
            "correct_answer": "2 s",
            "solution": "T = 2u sinθ/g = 2 × 20 × 0.5 / 10 = 2 s.",
            "difficulty": "medium",
            "concept": "Time of flight",
        },
    ],
    "SQL Joins": [
        {
            "question": "A customer may have zero or many orders. Which join returns "
                        "every customer, including customers with no matching order?",
            "options": [
                "INNER JOIN",
                "LEFT JOIN from Customer to Orders",
                "CROSS JOIN",
                "Self join only",
            ],
            "correct_answer": "LEFT JOIN from Customer to Orders",
            "solution": "A LEFT JOIN preserves every row from the left table and "
                        "returns NULL for unmatched right-side columns.",
            "difficulty": "medium",
            "concept": "Outer joins",
        },
    ],
    "Quadratic Equations": [
        {
            "question": "For x² − 5x + 6 = 0, what is the product of the roots?",
            "options": ["−5", "5", "6", "−6"],
            "correct_answer": "6",
            "solution": "For ax² + bx + c = 0, the product of roots is c/a. Here it is 6.",
            "difficulty": "easy",
            "concept": "Relations between roots and coefficients",
        },
    ],
}


def _demo_questions_full(topic: str, count: int, difficulty: str) -> list[dict]:
    """Return demo questions WITH correct_answer for server-side storage."""
    bank = _BANK.get(topic, [])
    result: list[dict] = []
    for i in range(count):
        if bank:
            q = dict(bank[i % len(bank)])
        else:
            q = {
                "question": f"Which approach is most appropriate when solving a "
                            f"problem about {topic}?",
                "options": [
                    "Apply the relevant definition and assumptions consistently",
                    "Ignore the conditions in the question",
                    "Choose a result without checking units or logic",
                    "Assume every related formula is interchangeable",
                ],
                "correct_answer": "Apply the relevant definition and assumptions consistently",
                "solution": (
                    f"Start from the definition and assumptions relevant to {topic}; "
                    "verify each step and the final result."
                ),
                "difficulty": difficulty,
                "concept": topic,
                "source_note": "Generic demo fallback; replace with curriculum-reviewed content.",
            }
        q["id"] = f"demo-{i + 1}"
        result.append(q)
    return result


def _strip_correct_answer(questions: list[dict]) -> list[dict]:
    """Return a copy of *questions* with 'correct_answer' removed from every item."""
    safe: list[dict] = []
    for q in questions:
        sq = {k: v for k, v in q.items() if k != "correct_answer"}
        safe.append(sq)
    return safe


def _parse_llm_response(content: str, count: int) -> list[dict] | None:
    """
    Parse an LLM JSON response string and return validated question dicts,
    or None if parsing / validation fails.
    """
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return None

    raw = data.get("questions", [])
    valid: list[dict] = []
    for i, q in enumerate(raw[:count]):
        opts = q.get("options", [])
        if (
            len(opts) == 4
            and q.get("correct_answer") in opts
            and q.get("question")
            and q.get("solution")
        ):
            valid.append({"id": f"llm-{i + 1}", **q})

    return valid if len(valid) == count else None


def _build_user_prompt(topic: str, subject: str, difficulty: str, count: int, exam_track: str) -> str:
    return (
        f"Create {count} MCQs for {exam_track}, subject {subject}, topic {topic}, "
        f"difficulty {difficulty}. "
        "Return a JSON object with this exact structure: "
        '{"questions":[{"question":"...","options":["A","B","C","D"],'
        '"correct_answer":"...","solution":"...","difficulty":"...","concept":"..."}]}. '
        "Each question must have exactly four options and correct_answer must exactly "
        "match one option. Use clear reasoning, avoid ambiguity, and do not invent "
        "source citations."
    )


class GroqService:
    """Wraps Groq SDK and legacy httpx LLM calls with demo fallback."""

    SYSTEM_QUESTION = (
        "You create careful educational assessments. Return valid JSON only."
    )
    SYSTEM_CHAT = (
        "You are LearnWise AI, a helpful study mentor for Class 11-12 students. "
        "Provide clear, curriculum-aligned explanations."
    )

    async def generate_questions(
        self,
        topic: str,
        subject: str,
        difficulty: str,
        count: int,
        exam_track: str,
    ) -> tuple[list[dict], list[dict], str]:
        """
        Returns (safe_questions, full_questions, provider).

        safe_questions  — correct_answer stripped; safe to send to the API caller.
        full_questions  — includes correct_answer; for server-side session storage only.
        provider        — 'groq', 'llm', 'demo', 'demo-fallback-*'
        """
        has_groq = bool(settings.groq_api_key)
        has_legacy = bool(settings.llm_api_key) and bool(settings.llm_model)

        if not has_groq and not has_legacy:
            full = _demo_questions_full(topic, count, difficulty)
            return _strip_correct_answer(full), full, "demo"

        user_prompt = _build_user_prompt(topic, subject, difficulty, count, exam_track)

        if has_groq:
            questions = await self._call_groq(user_prompt, count)
            if questions is not None:
                return _strip_correct_answer(questions), questions, "groq"
            # groq failed, fall through to legacy or demo
            if has_legacy:
                questions = await self._call_httpx(user_prompt, count)
                if questions is not None:
                    return _strip_correct_answer(questions), questions, "llm"
        else:
            questions = await self._call_httpx(user_prompt, count)
            if questions is not None:
                return _strip_correct_answer(questions), questions, "llm"

        full = _demo_questions_full(topic, count, difficulty)
        return _strip_correct_answer(full), full, "demo-fallback-error"

    async def chat_response(self, messages: list[dict]) -> str:
        """
        Send a message list to the LLM and return the assistant reply string.
        Falls back to a demo string if no key is configured or on error.
        """
        has_groq = bool(settings.groq_api_key)
        has_legacy = bool(settings.llm_api_key) and bool(settings.llm_model)

        if not has_groq and not has_legacy:
            return self._demo_chat_response(messages)

        all_messages = [{"role": "system", "content": self.SYSTEM_CHAT}] + messages

        if has_groq:
            reply = await self._groq_chat(all_messages)
            if reply is not None:
                return reply

        if has_legacy:
            reply = await self._httpx_chat(all_messages)
            if reply is not None:
                return reply

        return self._demo_chat_response(messages)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _call_groq(self, user_prompt: str, count: int) -> list[dict] | None:
        """Call Groq SDK; return parsed questions or None on failure."""
        try:
            from groq import AsyncGroq  # type: ignore  # noqa: PLC0415

            client = AsyncGroq(api_key=settings.groq_api_key)
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=settings.groq_model,
                    temperature=0.3,
                    messages=[
                        {"role": "system", "content": self.SYSTEM_QUESTION},
                        {"role": "user", "content": user_prompt},
                    ],
                ),
                timeout=settings.llm_timeout_seconds,
            )
            content = response.choices[0].message.content or ""
            return _parse_llm_response(content, count)
        except asyncio.TimeoutError:
            logger.warning("Groq request timed out after %ds", settings.llm_timeout_seconds)
            return None
        except Exception as exc:
            # Never log the api key value
            msg = str(exc)
            if "401" in msg or "authentication" in msg.lower():
                logger.warning("Groq authentication failed — check GROQ_API_KEY")
            elif "429" in msg or "rate" in msg.lower():
                logger.warning("Groq rate limited; retrying once after 2 s")
                await asyncio.sleep(2)
                try:
                    from groq import AsyncGroq  # type: ignore  # noqa: PLC0415

                    client = AsyncGroq(api_key=settings.groq_api_key)
                    response = await asyncio.wait_for(
                        client.chat.completions.create(
                            model=settings.groq_model,
                            temperature=0.3,
                            messages=[
                                {"role": "system", "content": self.SYSTEM_QUESTION},
                                {"role": "user", "content": user_prompt},
                            ],
                        ),
                        timeout=settings.llm_timeout_seconds,
                    )
                    content = response.choices[0].message.content or ""
                    return _parse_llm_response(content, count)
                except Exception:
                    return None
            else:
                logger.warning("Groq call failed: %s", type(exc).__name__)
            return None

    async def _call_httpx(self, user_prompt: str, count: int) -> list[dict] | None:
        """Call legacy OpenAI-compatible endpoint via httpx; return parsed questions or None."""
        try:
            async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
                resp = await client.post(
                    settings.llm_base_url.rstrip("/") + "/chat/completions",
                    headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                    json={
                        "model": settings.llm_model,
                        "temperature": 0.3,
                        "messages": [
                            {"role": "system", "content": self.SYSTEM_QUESTION},
                            {"role": "user", "content": user_prompt},
                        ],
                    },
                )
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"].strip()
                return _parse_llm_response(content, count)
        except Exception as exc:
            logger.warning("Legacy LLM call failed: %s", type(exc).__name__)
            return None

    async def _groq_chat(self, messages: list[dict]) -> str | None:
        """Send chat messages to Groq; return reply string or None on error."""
        try:
            from groq import AsyncGroq  # type: ignore  # noqa: PLC0415

            client = AsyncGroq(api_key=settings.groq_api_key)
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=settings.groq_model,
                    temperature=0.7,
                    messages=messages,
                ),
                timeout=settings.llm_timeout_seconds,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.warning("Groq chat failed: %s", type(exc).__name__)
            return None

    async def _httpx_chat(self, messages: list[dict]) -> str | None:
        """Send chat messages via httpx; return reply string or None on error."""
        try:
            async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
                resp = await client.post(
                    settings.llm_base_url.rstrip("/") + "/chat/completions",
                    headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                    json={
                        "model": settings.llm_model,
                        "temperature": 0.7,
                        "messages": messages,
                    },
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            logger.warning("Legacy LLM chat failed: %s", type(exc).__name__)
            return None

    @staticmethod
    def _demo_chat_response(messages: list[dict]) -> str:
        last = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")
        return (
            "I'm LearnWise AI, your study mentor. "
            f"You asked: \"{last[:120]}{'...' if len(last) > 120 else ''}\". "
            "I'm running in demo mode right now — configure GROQ_API_KEY and "
            "GROQ_MODEL in your backend .env file to get real AI responses."
        )


# Module-level singleton
groq_service = GroqService()
