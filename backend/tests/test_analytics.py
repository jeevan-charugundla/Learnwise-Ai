from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db import Base
from app.models import AssessmentRecord
from app.services.analytics import get_topic_analytics, get_recommendations

def test_weak_topic_ranked_first():
    engine=create_engine("sqlite://",connect_args={"check_same_thread":False},poolclass=StaticPool)
    Base.metadata.create_all(engine); Session=sessionmaker(bind=engine)
    with Session() as db:
        db.add_all([
          AssessmentRecord(student_id="S1",subject="Physics",topic="Motion",score=3,max_score=10,assessment_date=date(2026,1,1),difficulty="medium"),
          AssessmentRecord(student_id="S1",subject="Physics",topic="Motion",score=4,max_score=10,assessment_date=date(2026,1,2),difficulty="medium"),
          AssessmentRecord(student_id="S1",subject="Math",topic="Algebra",score=9,max_score=10,assessment_date=date(2026,1,1),difficulty="medium"),
          AssessmentRecord(student_id="S1",subject="Math",topic="Algebra",score=10,max_score=10,assessment_date=date(2026,1,2),difficulty="medium")])
        db.commit()
        topics=get_topic_analytics(db,"S1")
        assert topics[0]["topic"]=="Motion"
        assert get_recommendations(topics)[0]["topic"]=="Motion"
