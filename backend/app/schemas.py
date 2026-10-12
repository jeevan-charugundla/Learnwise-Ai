from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Practice / Question schemas
# ---------------------------------------------------------------------------

class PracticeGenerateRequest(BaseModel):
    subject: str = "Physics"
    topic: str = Field(min_length=2, max_length=160)
    difficulty: str = "medium"
    count: int = Field(default=5, ge=1, le=10)
    exam_track: str = "Class 11-12"


class PracticeSubmitAnswer(BaseModel):
    """Single answer in a submit request — no correct_answer, no question text."""
    question_id: str
    selected_answer: str


class PracticeSubmitRequest(BaseModel):
    session_id: str
    answers: list[PracticeSubmitAnswer]


# ---------------------------------------------------------------------------
# Chat / Conversation schemas
# ---------------------------------------------------------------------------

class ConversationCreate(BaseModel):
    title: str = "New conversation"


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Learning resource schemas
# ---------------------------------------------------------------------------

class LearningResourceResponse(BaseModel):
    id: int
    title: str
    description: str | None
    subject: str
    topic: str | None
    resource_type: str
    url: str | None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Subjects
# ---------------------------------------------------------------------------

class SubjectResponse(BaseModel):
    name: str


# ---------------------------------------------------------------------------
# Health / Ready
# ---------------------------------------------------------------------------

class HealthReadyResponse(BaseModel):
    status: str
    database: str
    llm: str


# ---------------------------------------------------------------------------
# Backward-compat: AnswerSubmission used by CSV import legacy route (if any).
# ---------------------------------------------------------------------------

class AnswerSubmission(BaseModel):
    question_id: str
    student_id: str = "STU001"
    subject: str = "Physics"
    topic: str
    question: str
    selected_answer: str
    correct_answer: str
    difficulty: str = "medium"
