"""
LearnWise AI — FastAPI application entry point.

Startup:
  - Creates all SQLAlchemy tables (idempotent).
  - No demo seed is run; demo data is generated on demand via demo_questions().

Auth:
  - Demo mode (SUPABASE_URL unset): all protected routes accept any request
    and use 'demo-user-001' as the user id.
  - Production mode: Bearer token from Supabase Auth is required for
    protected routes.
"""

import io
import json
from datetime import date

import pandas as pd
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.auth import get_current_user, optional_user
from app.core.config import settings
from app.db import Base, engine, get_db
from app.models import (
    AssessmentRecord,
    Conversation,
    LearningResource,
    Message,
    PracticeAttempt,
    PracticeSession,
)
from app.schemas import (
    ChatMessageResponse,
    ConversationCreate,
    HealthReadyResponse,
    LearningResourceResponse,
    MessageCreate,
    PracticeGenerateRequest,
    PracticeSubmitRequest,
    SubjectResponse,
)
from app.services.analytics import dashboard_summary, get_recommendations, get_topic_analytics
from app.services.groq_service import groq_service
from app.services.questions import generate_questions

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Adaptive learning API — LearnWise AI.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    """Create all tables on startup (no-op if they already exist)."""
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Root / Health
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"name": settings.app_name, "status": "ok", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/health/ready", response_model=HealthReadyResponse)
def health_ready(db: Session = Depends(get_db)):
    """
    Deep health check: verifies DB connectivity and LLM key presence.
    Public endpoint — no auth required.
    """
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    has_llm = bool(settings.groq_api_key) or bool(settings.llm_api_key)
    llm_status = "configured" if has_llm else "not_configured"

    return HealthReadyResponse(status="ok", database=db_status, llm=llm_status)


# ---------------------------------------------------------------------------
# Subjects (public)
# ---------------------------------------------------------------------------

@app.get("/api/subjects")
def subjects(db: Session = Depends(get_db)):
    """Return the list of available subjects."""
    hardcoded = [
        "Physics",
        "Chemistry",
        "Mathematics",
        "Biology",
        "Computer Science",
    ]
    # Supplement with any subjects already stored in learning_resources.
    try:
        rows = db.execute(
            text("SELECT DISTINCT subject FROM learning_resources ORDER BY subject")
        ).fetchall()
        db_subjects = [r[0] for r in rows]
        combined = list(dict.fromkeys(hardcoded + db_subjects))
    except Exception:
        combined = hardcoded
    return {"items": [{"name": s} for s in combined]}


# ---------------------------------------------------------------------------
# Learning Resources (public)
# ---------------------------------------------------------------------------

@app.get("/api/learning-resources")
def learning_resources(
    subject: str | None = None,
    topic: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(LearningResource)
    if subject:
        stmt = stmt.where(LearningResource.subject == subject)
    if topic:
        stmt = stmt.where(LearningResource.topic == topic)
    rows = db.scalars(stmt).all()
    return {
        "items": [
            LearningResourceResponse.model_validate(r).model_dump()
            for r in rows
        ]
    }


# ---------------------------------------------------------------------------
# Dashboard / Topics / Recommendations (auth-protected)
# ---------------------------------------------------------------------------

@app.get("/api/dashboard")
def dashboard(
    student_id: str = "STU001",
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    # In demo mode current_user == 'demo-user-001'; use it to scope data.
    uid = current_user if not settings.is_demo_mode else student_id
    return dashboard_summary(db, uid)


@app.get("/api/topics")
def topics(
    student_id: str = "STU001",
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    uid = current_user if not settings.is_demo_mode else student_id
    return {"items": get_topic_analytics(db, uid)}


@app.get("/api/recommendations")
def recommendations(
    student_id: str = "STU001",
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    uid = current_user if not settings.is_demo_mode else student_id
    return {"items": get_recommendations(get_topic_analytics(db, uid))}


# ---------------------------------------------------------------------------
# Practice — generate (auth-protected, returns NO correct_answer)
# ---------------------------------------------------------------------------

@app.post("/api/practice/generate")
async def practice_generate(
    payload: PracticeGenerateRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    safe_questions, full_questions, provider = await generate_questions(
        payload.topic,
        payload.subject,
        payload.difficulty,
        payload.count,
        payload.exam_track,
    )

    # Persist session with full questions (including correct_answer) server-side.
    session = PracticeSession(
        user_id=current_user,
        subject=payload.subject,
        topic=payload.topic,
        difficulty=payload.difficulty,
        questions_json=json.dumps(full_questions),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "topic": payload.topic,
        "subject": payload.subject,
        "provider": provider,
        "questions": safe_questions,  # correct_answer is NOT present here
        "notice": (
            "Prototype content; validate against the approved curriculum "
            "before high-stakes use."
        ),
    }


# ---------------------------------------------------------------------------
# Practice — submit (auth-protected, server-side answer checking)
# ---------------------------------------------------------------------------

@app.post("/api/practice/submit")
def practice_submit(
    payload: PracticeSubmitRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    # Load the session and verify ownership.
    session = db.get(PracticeSession, payload.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Practice session not found.")
    if session.user_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to submit answers for this session.",
        )

    # Retrieve stored full questions (with correct_answer).
    try:
        full_questions: list[dict] = json.loads(session.questions_json)
    except Exception:
        raise HTTPException(
            status_code=500, detail="Session data is corrupted."
        )

    question_map = {q["id"]: q for q in full_questions}

    correct = 0
    for ans in payload.answers:
        stored_q = question_map.get(ans.question_id)
        if stored_q is None:
            continue  # Unknown question id — skip gracefully.

        is_correct = ans.selected_answer.strip() == stored_q.get("correct_answer", "").strip()
        correct += int(is_correct)

        db.add(
            PracticeAttempt(
                student_id=current_user,
                user_id=current_user,
                subject=session.subject,
                topic=session.topic,
                question=stored_q.get("question", ""),
                selected_answer=ans.selected_answer,
                correct_answer=stored_q.get("correct_answer", ""),
                is_correct=int(is_correct),
                difficulty=session.difficulty,
            )
        )

    db.commit()
    total = len(payload.answers)
    return {
        "session_id": payload.session_id,
        "correct": correct,
        "total": total,
        "percentage": round(correct / total * 100, 1) if total else 0,
        "updated_topics": get_topic_analytics(db, current_user),
    }


# ---------------------------------------------------------------------------
# Reports (auth-protected)
# ---------------------------------------------------------------------------

@app.get("/api/reports/{student_id}")
def report(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    # In production, users can only view their own reports.
    if not settings.is_demo_mode and current_user != student_id:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own report.",
        )
    return {
        "report_title": "Personalized Learning Progress Report",
        **dashboard_summary(db, student_id),
    }


# ---------------------------------------------------------------------------
# CSV Import (optional auth)
# ---------------------------------------------------------------------------

@app.post("/api/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str | None = Depends(optional_user),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Upload a .csv file.")
    raw = await file.read()
    max_bytes = settings.max_csv_size_mb * 1_000_000
    if len(raw) > max_bytes:
        raise HTTPException(413, f"CSV must be smaller than {settings.max_csv_size_mb} MB.")
    try:
        frame = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(400, f"Could not parse CSV: {exc}")

    required = {"student_id", "subject", "topic", "score", "max_score", "assessment_date", "difficulty"}
    missing = required - set(frame.columns)
    if missing:
        raise HTTPException(400, {"message": "Missing required columns", "missing": sorted(missing)})

    accepted: list[AssessmentRecord] = []
    errors: list[dict] = []
    for idx, row in frame.iterrows():
        try:
            sid = str(row.student_id).strip()
            subject = str(row.subject).strip()
            topic = str(row.topic).strip()
            score = float(row.score)
            maximum = float(row.max_score)
            day = date.fromisoformat(str(row.assessment_date)[:10])
            difficulty = str(row.difficulty).strip().lower()
            if not sid or not subject or not topic:
                raise ValueError("student_id, subject, and topic cannot be empty")
            if maximum <= 0 or score < 0 or score > maximum:
                raise ValueError("score must be between 0 and max_score")
            if difficulty not in {"easy", "medium", "hard"}:
                difficulty = "medium"
            record = AssessmentRecord(
                student_id=sid,
                user_id=current_user,  # None when no token present
                subject=subject,
                topic=topic,
                score=score,
                max_score=maximum,
                assessment_date=day,
                difficulty=difficulty,
            )
            accepted.append(record)
        except Exception as exc:
            errors.append({"row": int(idx) + 2, "error": str(exc)})

    db.add_all(accepted)
    db.commit()
    return {"imported": len(accepted), "rejected": len(errors), "errors": errors[:50]}


# ---------------------------------------------------------------------------
# Chat / Conversations (auth-protected)
# ---------------------------------------------------------------------------

@app.get("/api/chat/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    convs = db.scalars(
        select(Conversation)
        .where(Conversation.user_id == current_user)
        .order_by(Conversation.created_at.desc())
    ).all()
    return {
        "items": [
            {
                "id": c.id,
                "title": c.title,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in convs
        ]
    }


@app.post("/api/chat/conversations")
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    conv = Conversation(
        user_id=current_user,
        title=payload.title or "New conversation",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {
        "id": conv.id,
        "title": conv.title,
        "user_id": conv.user_id,
        "created_at": conv.created_at.isoformat(),
    }


@app.post(
    "/api/chat/conversations/{conv_id}/messages",
    response_model=ChatMessageResponse,
)
async def send_message_to_conversation(
    conv_id: str,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    # Verify conversation exists and belongs to current user.
    conv = db.get(Conversation, conv_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    if conv.user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Persist the user message.
    user_msg = Message(
        conversation_id=conv_id,
        role="user",
        content=payload.content,
    )
    db.add(user_msg)
    db.flush()  # get user_msg.id without full commit

    # Build context from recent messages (last 20).
    recent = db.scalars(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    ).all()
    context_messages = [
        {"role": m.role, "content": m.content}
        for m in reversed(recent)
    ]

    # Call LLM / demo.
    reply_text = await groq_service.chat_response(context_messages)

    # Persist the assistant message.
    assistant_msg = Message(
        conversation_id=conv_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatMessageResponse.model_validate(assistant_msg)
