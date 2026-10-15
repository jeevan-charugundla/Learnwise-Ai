from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import AssessmentRecord, PracticeAttempt

def pct(score: float, maximum: float) -> float:
    return round(score / maximum * 100, 1) if maximum > 0 else 0.0

def get_topic_analytics(db: Session, student_id: str):
    rows = db.scalars(select(AssessmentRecord).where(AssessmentRecord.student_id == student_id).order_by(AssessmentRecord.assessment_date)).all()
    attempts = db.scalars(select(PracticeAttempt).where(PracticeAttempt.student_id == student_id)).all()
    grouped = defaultdict(list)
    practice = defaultdict(list)
    for row in rows:
        grouped[(row.subject, row.topic)].append(pct(row.score, row.max_score))
    for attempt in attempts:
        practice[(attempt.subject, attempt.topic)].append(bool(attempt.is_correct))
    result = []
    for (subject, topic), scores in grouped.items():
        weights = list(range(1, len(scores) + 1))
        weighted = sum(s*w for s, w in zip(scores, weights)) / sum(weights)
        ps = practice.get((subject, topic), [])
        practice_pct = sum(ps) / len(ps) * 100 if ps else None
        mastery = round(weighted * .8 + practice_pct * .2 if practice_pct is not None else weighted, 1)
        evidence = len(scores) + len(ps)
        status = "Need more evidence" if evidence < 2 else "Needs attention" if mastery < 50 else "Developing" if mastery < 72 else "On track"
        result.append({"subject":subject,"topic":topic,"mastery":mastery,"gap":round(100-mastery,1),
            "assessments":len(scores),"practice_attempts":len(ps),"evidence_count":evidence,"status":status,
            "latest_score":scores[-1] if scores else None,"trend":round(scores[-1]-scores[0],1) if len(scores)>1 else 0})
    return sorted(result, key=lambda x: (x["mastery"], -x["evidence_count"]))

def get_recommendations(topics: list[dict]):
    result = []
    for t in topics:
        if t["status"] == "Need more evidence":
            action, kind = "Take a short diagnostic quiz to establish a reliable baseline.", "diagnostic"
        elif t["mastery"] < 50:
            action, kind = "Review the core concept, study a worked example, then attempt guided practice.", "concept-repair"
        elif t["mastery"] < 72:
            action, kind = "Practice multi-step applications and review mistakes after each attempt.", "targeted-practice"
        else:
            action, kind = "Use spaced revision and attempt a harder mixed-concept question set.", "stretch"
        priority = round(t["gap"] * (1.0 if t["evidence_count"] >= 2 else .55), 1)
        result.append({"subject":t["subject"],"topic":t["topic"],"mastery":t["mastery"],"priority":priority,
            "type":kind,"reason":f'{t["status"]}: estimated mastery is {t["mastery"]}% from {t["evidence_count"]} evidence items.',
            "action":action})
    return sorted(result, key=lambda x: x["priority"], reverse=True)

def dashboard_summary(db: Session, student_id: str):
    topics = get_topic_analytics(db, student_id)
    rows = db.scalars(select(AssessmentRecord).where(AssessmentRecord.student_id == student_id)).all()
    earned, possible = sum(r.score for r in rows), sum(r.max_score for r in rows)
    return {"student_id":student_id,"overall_score":round(earned/possible*100,1) if possible else 0,
        "topics_tracked":len(topics),"topics_needing_attention":sum(t["status"] in ("Needs attention","Need more evidence") for t in topics),
        "assessments_count":len(rows),"topics":topics,"recommendations":get_recommendations(topics),
        "recent_assessments":[{"subject":r.subject,"topic":r.topic,"score":r.score,"max_score":r.max_score,
            "percentage":pct(r.score,r.max_score),"date":r.assessment_date.isoformat()}
            for r in sorted(rows,key=lambda x:x.assessment_date,reverse=True)[:8]]}
