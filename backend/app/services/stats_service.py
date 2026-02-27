from sqlmodel import Session, select, col, text
from ..models.database import TestSession, QuestionResult, engine


def get_overview() -> dict:
    with Session(engine) as session:
        sessions = session.exec(select(TestSession)).all()
        if not sessions:
            return {
                'total_sessions': 0,
                'total_questions': 0,
                'overall_accuracy': 0,
                'part_accuracy': {},
                'weak_categories': []
            }

        total_q = sum(s.total_questions for s in sessions)
        total_correct = sum(s.correct_count for s in sessions)

        # 各 Part 正確率
        part_accuracy = {}
        for part in ['5', '6', '7']:
            part_sessions = [s for s in sessions if s.part == part]
            if part_sessions:
                pq = sum(s.total_questions for s in part_sessions)
                pc = sum(s.correct_count for s in part_sessions)
                part_accuracy[part] = round(pc / pq * 100, 1) if pq > 0 else 0

        # 弱項文法類型 (用原生 SQL 避免 ORM 相容性問題)
        weak = []
        try:
            rows = session.exec(text(
                "SELECT grammar_category, COUNT(*) as total, "
                "SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct "
                "FROM question_results "
                "WHERE grammar_category IS NOT NULL "
                "GROUP BY grammar_category"
            )).all()
            for row in rows:
                cat, total, correct = row
                if total >= 3 and (correct or 0) / total < 0.6:
                    weak.append(cat)
        except Exception:
            pass

        return {
            'total_sessions': len(sessions),
            'total_questions': total_q,
            'overall_accuracy': round(total_correct / total_q * 100, 1) if total_q > 0 else 0,
            'part_accuracy': part_accuracy,
            'weak_categories': weak[:5]
        }


def get_history(limit: int = 20) -> list[dict]:
    with Session(engine) as session:
        sessions = session.exec(
            select(TestSession)
            .order_by(col(TestSession.created_at).desc())
            .limit(limit)
        ).all()
        return [
            {
                'id': s.id,
                'mode': s.mode,
                'part': s.part,
                'score': s.score,
                'total_questions': s.total_questions,
                'correct_count': s.correct_count,
                'time_spent_seconds': s.time_spent_seconds,
                'created_at': s.created_at.isoformat()
            }
            for s in sessions
        ]
