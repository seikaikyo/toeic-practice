export interface Question {
  id: string
  sentence: string
  options: string[]
  answer: string
  explanation: string
  grammar_category?: string
}

export interface PassageQuestion {
  blank_number?: number
  question?: string
  options: string[]
  answer: string | number
  explanation: string
}

export interface Passage {
  id: string
  passage_type: string
  passage: string
  questions: PassageQuestion[]
}

export type QuizItem = Question | Passage

export interface QuizConfig {
  part: '5' | '6' | '7' | 'mixed'
  count: number
}

export interface SubmitPayload {
  mode: 'practice' | 'mock'
  part: string
  answers: AnswerItem[]
  time_spent_seconds: number
}

export interface AnswerItem {
  question_id: string
  part: string
  user_answer: string
  correct_answer: string
  is_correct: boolean
  grammar_category?: string
}

export interface SessionResult {
  session_id: number
  mode: string
  part: string
  total_questions: number
  correct_count: number
  score: number
  time_spent_seconds: number
  estimated_toeic_score?: string
}

export interface StatsOverview {
  total_sessions: number
  total_questions: number
  overall_accuracy: number
  part_accuracy: Record<string, number>
  weak_categories: string[]
}

export interface SessionHistory {
  id: number
  mode: string
  part: string
  score: number
  total_questions: number
  correct_count: number
  time_spent_seconds: number
  created_at: string
}
