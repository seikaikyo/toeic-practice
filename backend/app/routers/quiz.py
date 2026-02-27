from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import Session
from ..models.database import engine, TestSession, QuestionResult
from ..services.question_bank import question_bank

router = APIRouter(prefix='/api/quiz', tags=['quiz'])


class AnswerItem(BaseModel):
    question_id: str
    part: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    grammar_category: str | None = None


class SubmitRequest(BaseModel):
    mode: str  # practice, mock
    part: str  # 5, 6, 7, mixed
    answers: list[AnswerItem]
    time_spent_seconds: int = 0


def _estimate_toeic_score(accuracy: float) -> str:
    if accuracy >= 90:
        return '450-495'
    elif accuracy >= 80:
        return '400-445'
    elif accuracy >= 70:
        return '350-395'
    elif accuracy >= 60:
        return '300-345'
    return 'Below 300'


@router.get('/questions')
async def get_questions(part: str = '5', count: int = 10):
    questions = question_bank.get_questions(part, count)
    return {'success': True, 'data': questions}


@router.get('/mock-test')
async def get_mock_test():
    data = question_bank.get_mock_test()
    return {'success': True, 'data': data}


@router.post('/submit')
async def submit_answers(req: SubmitRequest):
    correct_count = sum(1 for a in req.answers if a.is_correct)
    total = len(req.answers)
    score = round(correct_count / total * 100, 1) if total > 0 else 0

    with Session(engine) as session:
        test_session = TestSession(
            mode=req.mode,
            part=req.part,
            total_questions=total,
            correct_count=correct_count,
            score=score,
            time_spent_seconds=req.time_spent_seconds
        )
        session.add(test_session)
        session.commit()
        session.refresh(test_session)
        session_id = test_session.id

        for a in req.answers:
            qr = QuestionResult(
                session_id=session_id,
                part=a.part,
                question_id=a.question_id,
                user_answer=a.user_answer,
                correct_answer=a.correct_answer,
                is_correct=a.is_correct,
                grammar_category=a.grammar_category
            )
            session.add(qr)
        session.commit()

    result = {
        'session_id': session_id,
        'mode': req.mode,
        'part': req.part,
        'total_questions': total,
        'correct_count': correct_count,
        'score': score,
        'time_spent_seconds': req.time_spent_seconds,
    }

    if req.mode == 'mock':
        result['estimated_toeic_score'] = _estimate_toeic_score(score)

    return {'success': True, 'data': result}
