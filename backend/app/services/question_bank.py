import json
import random
import logging
from pathlib import Path
from ..config import DATA_DIR

logger = logging.getLogger(__name__)

QUESTION_BANK_DIR = DATA_DIR / 'question_bank'


class QuestionBankService:

    def __init__(self):
        self._part5: list[dict] = []
        self._part6: list[dict] = []
        self._part7: list[dict] = []
        self._loaded = False

    def load(self):
        for part, attr in [('part5', '_part5'), ('part6', '_part6'), ('part7', '_part7')]:
            path = QUESTION_BANK_DIR / f'{part}.json'
            if path.exists():
                try:
                    data = json.loads(path.read_text(encoding='utf-8'))
                    setattr(self, attr, data if isinstance(data, list) else [])
                    logger.info('載入 %s: %d 題', part, len(getattr(self, attr)))
                except (json.JSONDecodeError, KeyError) as e:
                    logger.error('載入 %s 失敗: %s', part, e)
            else:
                logger.warning('題庫檔案不存在: %s', path)
        self._loaded = True

    def get_questions(self, part: str, count: int) -> list[dict]:
        pool = self._get_pool(part)
        if not pool:
            return []
        return random.sample(pool, min(count, len(pool)))

    def get_mock_test(self) -> dict:
        p5 = random.sample(self._part5, min(30, len(self._part5)))
        p6 = random.sample(self._part6, min(8, len(self._part6)))
        p7 = random.sample(self._part7, min(10, len(self._part7)))
        return {
            'part5': p5,
            'part6': p6,
            'part7': p7,
            'total_questions': self._count_questions(p5, p6, p7)
        }

    def _count_questions(self, p5: list, p6: list, p7: list) -> int:
        count = len(p5)
        for p in p6:
            count += len(p.get('questions', []))
        for p in p7:
            count += len(p.get('questions', []))
        return count

    def _get_pool(self, part: str) -> list[dict]:
        if part == '5':
            return self._part5
        elif part == '6':
            return self._part6
        elif part == '7':
            return self._part7
        elif part == 'mixed':
            return self._part5 + self._part6 + self._part7
        return []

    def get_status(self) -> dict:
        return {
            'loaded': self._loaded,
            'part5': len(self._part5),
            'part6': len(self._part6),
            'part7': len(self._part7),
            'total': len(self._part5) + len(self._part6) + len(self._part7)
        }


question_bank = QuestionBankService()
