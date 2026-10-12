"""
questions.py — thin wrapper around GroqService.

This module is kept as the public interface used by main.py so that tests and
other callers do not need to import groq_service directly.

IMPORTANT:
  - demo_questions()      — returns questions WITHOUT correct_answer (safe for API responses).
  - demo_questions_full() — returns questions WITH  correct_answer (for server-side storage only).
  - generate_questions()  — returns (safe_questions, full_questions, provider).
    caller must NEVER send full_questions to the API response.
"""

from app.services.groq_service import groq_service, _demo_questions_full, _strip_correct_answer

# Keep BANK accessible from tests that might import it directly.
from app.services.groq_service import _BANK as BANK  # noqa: N812


def demo_questions(topic: str, count: int, difficulty: str) -> list[dict]:
    """Return demo questions WITHOUT correct_answer — safe to return to API callers."""
    return _strip_correct_answer(_demo_questions_full(topic, count, difficulty))


def demo_questions_full(topic: str, count: int, difficulty: str) -> list[dict]:
    """Return demo questions WITH correct_answer — for server-side storage only."""
    return _demo_questions_full(topic, count, difficulty)


async def generate_questions(
    topic: str,
    subject: str,
    difficulty: str,
    count: int,
    exam_track: str,
) -> tuple[list[dict], list[dict], str]:
    """
    Returns (safe_questions, full_questions, provider).

    safe_questions  — no correct_answer; safe to include in API responses.
    full_questions  — includes correct_answer; for PracticeSession.questions_json only.
    provider        — 'groq' | 'llm' | 'demo' | 'demo-fallback-*'
    """
    return await groq_service.generate_questions(topic, subject, difficulty, count, exam_track)
