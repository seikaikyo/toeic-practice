"""將 ai-english-tutor TOEIC 題庫轉換為結構化 JSON

Part 5: 直接搬移，移除 response 欄位
Part 6: 從 markdown 解析出 passage + questions
Part 7: 從 markdown 解析出 passage + questions
"""

import json
import re
from pathlib import Path

SRC_DIR = Path(__file__).parent.parent.parent / 'ai-english-tutor' / 'backend' / 'data' / 'question_bank' / 'drills'
DST_DIR = Path(__file__).parent.parent / 'backend' / 'data' / 'question_bank'


def restructure_part5():
    """Part 5 已有結構化欄位，移除 response 即可"""
    src = SRC_DIR / 'toeic_part5.json'
    data = json.loads(src.read_text(encoding='utf-8'))

    result = []
    for q in data:
        result.append({
            'id': q['id'],
            'sentence': q['sentence'],
            'options': q['options'],
            'answer': q['answer'],
            'explanation': q['explanation'],
            'grammar_category': _detect_grammar_category(q['explanation'])
        })

    return result


def _detect_grammar_category(explanation: str) -> str:
    """從解析推測文法分類"""
    exp_lower = explanation.lower()
    patterns = [
        ('verb tense', ['past tense', 'present tense', 'future tense', 'present perfect',
                         'past perfect', 'progressive', 'continuous']),
        ('passive voice', ['passive voice', 'passive', 'is expected to']),
        ('conditionals', ['conditional', 'type 1', 'type 2', 'type 3', 'if + past']),
        ('subjunctive', ['subjunctive', 'request, demand', 'require']),
        ('word form', ['adverb', 'adjective', 'noun', 'verb form', 'word families',
                        'modif']),
        ('preposition', ['preposition', 'prepositional', 'collocation', 'fixed phrase',
                          'walking distance', 'responsible for', 'praise.*for']),
        ('relative clause', ['relative pronoun', 'relative clause', 'who', 'which',
                              'whom', 'whose', 'whoever']),
        ('gerund/infinitive', ['gerund', 'infinitive', 'to-infinitive', '-ing form',
                                'suggest', 'consider', 'encourage']),
        ('subject-verb agreement', ['singular verb', 'plural verb', 'proximity rule',
                                     'the number of', 'each']),
        ('comparative/superlative', ['comparative', 'superlative', 'than', '-er',
                                      'more widely']),
        ('conjunction', ['conjunction', 'despite', 'although', 'once', 'while']),
        ('participle', ['participle', 'reduced relative', 'past participle',
                         'present participle']),
    ]

    for category, keywords in patterns:
        for kw in keywords:
            if re.search(kw, exp_lower):
                return category

    return 'vocabulary'


def restructure_part6():
    """Part 6: 從 markdown 解析段落 + 題目"""
    src = SRC_DIR / 'toeic_part6.json'
    data = json.loads(src.read_text(encoding='utf-8'))

    result = []
    for item in data:
        parsed = _parse_part6_response(item['response'], item['answers'])
        result.append({
            'id': item['id'],
            'passage_type': item['passage_type'],
            'passage': parsed['passage'],
            'questions': parsed['questions']
        })

    return result


def _parse_part6_response(response: str, answers: dict) -> dict:
    """解析 Part 6 的 markdown response"""
    lines = response.split('\n')

    passage_lines = []
    question_lines = []
    explanation_lines = []
    section = 'header'

    dash_count = 0
    for line in lines:
        stripped = line.strip()
        if stripped == '---':
            dash_count += 1
            if dash_count == 1:
                section = 'passage'
            elif dash_count == 2:
                section = 'questions'
            elif dash_count >= 3:
                section = 'explanations'
            continue

        if section == 'passage':
            passage_lines.append(line)
        elif section == 'questions':
            question_lines.append(line)
        elif section == 'explanations':
            explanation_lines.append(line)

    # 段落文字（去除開頭的 **Passage N** 行）
    passage_text = '\n'.join(passage_lines).strip()
    # 移除 **Passage N** (Type — Topic) 開頭
    passage_text = re.sub(r'^\*\*Passage \d+\*\*.*?\n\n', '', passage_text, flags=re.DOTALL)

    # 解析題目選項
    questions = []
    q_text = '\n'.join(question_lines).strip()
    # 格式: **Q1:** 1. opt1  2. opt2  3. opt3  4. opt4
    q_pattern = re.compile(r'\*\*Q(\d+):\*\*\s*(.+)')
    for match in q_pattern.finditer(q_text):
        q_num = int(match.group(1))
        opts_str = match.group(2).strip()
        # 解析選項: "1. opt1  2. opt2  3. opt3  4. opt4"
        opts = re.findall(r'\d+\.\s*(.+?)(?=\s+\d+\.|$)', opts_str)
        opts = [o.strip() for o in opts]

        q_key = f'Q{q_num}'
        answer = answers.get(q_key, '')

        # 解析解析
        explanation = ''
        exp_text = '\n'.join(explanation_lines)
        exp_match = re.search(rf'{q_key}\s*=\s*\d+\.\s*.+?\s*[—–-]\s*(.+?)(?=\n-\s*Q\d+|$)', exp_text, re.DOTALL)
        if exp_match:
            explanation = exp_match.group(1).strip()

        questions.append({
            'blank_number': q_num,
            'options': opts,
            'answer': str(answer),
            'explanation': explanation
        })

    return {
        'passage': passage_text.strip(),
        'questions': questions
    }


def restructure_part7():
    """Part 7: 從 markdown 解析段落 + 題目"""
    src = SRC_DIR / 'toeic_part7.json'
    data = json.loads(src.read_text(encoding='utf-8'))

    result = []
    for item in data:
        parsed = _parse_part7_response(item['response'], item['answers'])
        result.append({
            'id': item['id'],
            'passage_type': item['passage_type'],
            'passage': parsed['passage'],
            'questions': parsed['questions']
        })

    return result


def _parse_part7_response(response: str, answers: dict) -> dict:
    """解析 Part 7 的 markdown response"""
    lines = response.split('\n')

    passage_lines = []
    question_section = []
    section = 'header'

    dash_count = 0
    for line in lines:
        stripped = line.strip()
        if stripped == '---':
            dash_count += 1
            if dash_count == 1:
                section = 'passage'
            elif dash_count == 2:
                section = 'questions'
            elif dash_count >= 3:
                section = 'answers'
            continue

        if section == 'passage':
            passage_lines.append(line)
        elif section == 'questions':
            question_section.append(line)

    # 段落文字
    passage_text = '\n'.join(passage_lines).strip()
    # 移除 **Reading Passage N** (...) 開頭
    passage_text = re.sub(r'^\*\*Reading Passage \d+\*\*.*?\n\n', '', passage_text, flags=re.DOTALL)

    # 解析題目
    questions = []
    q_text = '\n'.join(question_section)

    # 分割成個別題目: **Q1.** ... **Q2.** ...
    q_blocks = re.split(r'(?=\*\*Q\d+\.?\*\*)', q_text)
    q_blocks = [b.strip() for b in q_blocks if b.strip()]

    for block in q_blocks:
        # 題號和問題
        q_match = re.match(r'\*\*Q(\d+)\.?\*\*\s*(.+)', block)
        if not q_match:
            continue

        q_num = int(q_match.group(1))
        question_text = q_match.group(2).strip()

        # 選項：只匹配行首的數字編號（排除題目行本身）
        block_lines = block.split('\n')
        opts = []
        for bline in block_lines[1:]:  # 跳過第一行（題目行）
            opt_match = re.match(r'\s*(\d+)\.\s+(.+)', bline)
            if opt_match:
                opts.append(opt_match.group(2).strip())

        q_key = f'Q{q_num}'
        answer_idx = answers.get(q_key, 0)

        questions.append({
            'question': question_text,
            'options': opts,
            'answer': int(answer_idx) if isinstance(answer_idx, (int, float)) else answer_idx
        })

    return {
        'passage': passage_text.strip(),
        'questions': questions
    }


def main():
    DST_DIR.mkdir(parents=True, exist_ok=True)

    # Part 5
    part5 = restructure_part5()
    (DST_DIR / 'part5.json').write_text(
        json.dumps(part5, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    print(f'Part 5: {len(part5)} questions')

    # Part 6
    part6 = restructure_part6()
    (DST_DIR / 'part6.json').write_text(
        json.dumps(part6, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    total_p6 = sum(len(p['questions']) for p in part6)
    print(f'Part 6: {len(part6)} passages, {total_p6} questions')

    # Part 7
    part7 = restructure_part7()
    (DST_DIR / 'part7.json').write_text(
        json.dumps(part7, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    total_p7 = sum(len(p['questions']) for p in part7)
    print(f'Part 7: {len(part7)} passages, {total_p7} questions')

    print(f'\n總計: {len(part5) + total_p6 + total_p7} 題')


if __name__ == '__main__':
    main()
