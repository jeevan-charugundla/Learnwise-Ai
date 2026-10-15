"""
Integration tests for the LearnWise AI FastAPI backend.
Tests run against a real in-process TestClient in demo mode
(SUPABASE_URL unset → SQLite, no auth required).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# In demo mode, any (or no) token is accepted.
DEMO_HEADERS = {"Authorization": "Bearer demo-token"}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_root():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_health_ready():
    res = client.get("/api/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "database" in data
    assert "llm" in data


# ---------------------------------------------------------------------------
# Subjects  (public)
# ---------------------------------------------------------------------------

def test_get_subjects():
    res = client.get("/api/subjects")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    # At least the hard-coded subjects should appear
    names = [i["name"] for i in data["items"]]
    assert "Physics" in names
    assert "Mathematics" in names


# ---------------------------------------------------------------------------
# Learning Resources  (public)
# ---------------------------------------------------------------------------

def test_get_learning_resources_no_filter():
    res = client.get("/api/learning-resources")
    assert res.status_code == 200
    assert "items" in res.json()


def test_get_learning_resources_by_subject():
    res = client.get("/api/learning-resources?subject=Physics")
    assert res.status_code == 200
    assert "items" in res.json()


# ---------------------------------------------------------------------------
# Dashboard  (demo auth)
# ---------------------------------------------------------------------------

def test_dashboard_with_demo_auth():
    res = client.get("/api/dashboard", headers=DEMO_HEADERS)
    assert res.status_code == 200


def test_dashboard_no_auth():
    """Demo mode accepts requests without a token."""
    res = client.get("/api/dashboard")
    # Demo mode: 200; production mode: 401
    assert res.status_code in (200, 401)


# ---------------------------------------------------------------------------
# Topics  (demo auth)
# ---------------------------------------------------------------------------

def test_get_topics():
    res = client.get("/api/topics", headers=DEMO_HEADERS)
    assert res.status_code == 200
    assert "items" in res.json()


# ---------------------------------------------------------------------------
# Recommendations  (demo auth)
# ---------------------------------------------------------------------------

def test_get_recommendations():
    res = client.get("/api/recommendations", headers=DEMO_HEADERS)
    assert res.status_code == 200
    assert "items" in res.json()


# ---------------------------------------------------------------------------
# Practice — generate  (demo auth)
# ---------------------------------------------------------------------------

def test_practice_generate():
    res = client.post(
        "/api/practice/generate",
        json={"subject": "Physics", "topic": "Newton's Laws", "difficulty": "medium", "count": 3},
        headers=DEMO_HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert "questions" in data
    assert isinstance(data["questions"], list)
    assert len(data["questions"]) > 0
    q = data["questions"][0]
    assert "id" in q
    assert "question" in q


def test_practice_generate_missing_topic():
    res = client.post(
        "/api/practice/generate",
        json={"subject": "Physics", "topic": " ", "difficulty": "medium", "count": 3},
        headers=DEMO_HEADERS,
    )
    # FastAPI validation should return 422
    assert res.status_code in (422, 400)


# ---------------------------------------------------------------------------
# Practice — submit  (demo auth)
# ---------------------------------------------------------------------------

def test_practice_submit_flow():
    """Full round-trip: generate then submit."""
    # Generate a session first
    gen_res = client.post(
        "/api/practice/generate",
        json={"subject": "Mathematics", "topic": "Algebra", "difficulty": "easy", "count": 2},
        headers=DEMO_HEADERS,
    )
    assert gen_res.status_code == 200
    session_id = gen_res.json()["session_id"]
    questions = gen_res.json()["questions"]

    answers = [{"question_id": q["id"], "selected_answer": q["options"][0]} for q in questions]

    sub_res = client.post(
        "/api/practice/submit",
        json={"session_id": session_id, "answers": answers},
        headers=DEMO_HEADERS,
    )
    assert sub_res.status_code == 200
    data = sub_res.json()
    assert "correct" in data
    assert "total" in data
    assert "percentage" in data
    assert data["total"] == len(answers)


def test_practice_submit_invalid_session():
    res = client.post(
        "/api/practice/submit",
        json={"session_id": "non-existent-session-id", "answers": []},
        headers=DEMO_HEADERS,
    )
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Chat conversations  (demo auth)
# ---------------------------------------------------------------------------

def test_list_conversations():
    res = client.get("/api/chat/conversations", headers=DEMO_HEADERS)
    assert res.status_code == 200
    assert "items" in res.json()


def test_create_conversation():
    res = client.post(
        "/api/chat/conversations",
        json={"title": "Test conversation"},
        headers=DEMO_HEADERS,
    )
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["title"] == "Test conversation"


def test_send_message_to_conversation():
    # Create conversation first
    conv_res = client.post(
        "/api/chat/conversations",
        json={"title": "Message test"},
        headers=DEMO_HEADERS,
    )
    assert conv_res.status_code == 200
    conv_id = conv_res.json()["id"]

    # Send a message
    msg_res = client.post(
        f"/api/chat/conversations/{conv_id}/messages",
        json={"content": "What is Newton's first law?"},
        headers=DEMO_HEADERS,
    )
    assert msg_res.status_code == 200
    data = msg_res.json()
    assert data["role"] == "assistant"
    assert "content" in data
    assert len(data["content"]) > 0


def test_send_message_wrong_conversation():
    res = client.post(
        "/api/chat/conversations/non-existent-id/messages",
        json={"content": "Hello"},
        headers=DEMO_HEADERS,
    )
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Reports  (demo auth)
# ---------------------------------------------------------------------------

def test_get_report():
    res = client.get("/api/reports/demo-user-001", headers=DEMO_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert "report_title" in data
