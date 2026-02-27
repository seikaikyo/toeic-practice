<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import { useTimer } from '../composables/useTimer'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import TimerDisplay from '../components/Timer.vue'
import MockTestResult from '../components/MockTestResult.vue'
import type { Question, Passage, AnswerItem, SessionResult, SubmitPayload } from '../types'

const router = useRouter()
const api = useApi()
const timer = useTimer(75 * 60)

const isLoading = ref(false)
const hasStarted = ref(false)
const isComplete = ref(false)
const showConfirmDialog = ref(false)
const result = ref<SessionResult | null>(null)

const part5Questions = ref<Question[]>([])
const part6Passages = ref<Passage[]>([])
const part7Passages = ref<Passage[]>([])

// Track current section and index
const currentSection = ref<'part5' | 'part6' | 'part7'>('part5')
const currentIndex = ref(0)

// Answers stored by question ID
const answers = ref<Map<string, AnswerItem>>(new Map())

const allQuestions = computed(() => {
  const items: { type: string; label: string; id: string }[] = []
  part5Questions.value.forEach((q, i) => {
    items.push({ type: 'part5', label: `P5-${i + 1}`, id: q.id })
  })
  part6Passages.value.forEach((p, pi) => {
    p.questions.forEach((_, qi) => {
      items.push({ type: 'part6', label: `P6-${pi + 1}.${qi + 1}`, id: `${p.id}_q${qi + 1}` })
    })
  })
  part7Passages.value.forEach((p, pi) => {
    p.questions.forEach((_, qi) => {
      items.push({ type: 'part7', label: `P7-${pi + 1}.${qi + 1}`, id: `${p.id}_q${qi + 1}` })
    })
  })
  return items
})

const currentPart5 = computed(() => part5Questions.value[currentIndex.value])
const currentPart6 = computed(() => part6Passages.value[currentIndex.value])
const currentPart7 = computed(() => part7Passages.value[currentIndex.value])

const totalQuestions = computed(() => allQuestions.value.length)
const answeredCount = computed(() => answers.value.size)

async function startTest() {
  isLoading.value = true
  try {
    const data = await api.get<{
      part5: Question[]
      part6: Passage[]
      part7: Passage[]
      total_questions: number
    }>('/quiz/mock-test')
    part5Questions.value = data.part5
    part6Passages.value = data.part6
    part7Passages.value = data.part7
    hasStarted.value = true
    timer.start()
  } catch (e) {
    console.error('Failed to load mock test:', e)
  } finally {
    isLoading.value = false
  }
}

function selectAnswer(questionId: string, part: string, userAnswer: string, correctAnswer: string) {
  answers.value.set(questionId, {
    question_id: questionId,
    part,
    user_answer: userAnswer,
    correct_answer: correctAnswer,
    is_correct: userAnswer === correctAnswer
  })
}

function confirmSubmit() {
  showConfirmDialog.value = true
}

async function submitTest() {
  showConfirmDialog.value = false
  timer.stop()
  isComplete.value = true

  const answerList = Array.from(answers.value.values())
  try {
    const payload: SubmitPayload = {
      mode: 'mock',
      part: 'mixed',
      answers: answerList,
      time_spent_seconds: timer.elapsed.value
    }
    result.value = await api.post<SessionResult>('/quiz/submit', payload)
  } catch (e) {
    console.error('Submit failed:', e)
    const correct = answerList.filter(a => a.is_correct).length
    const total = answerList.length
    const score = total > 0 ? Math.round(correct / total * 100 * 10) / 10 : 0
    result.value = {
      session_id: 0,
      mode: 'mock',
      part: 'mixed',
      total_questions: total,
      correct_count: correct,
      score,
      time_spent_seconds: timer.elapsed.value,
      estimated_toeic_score: score >= 90 ? '450-495' : score >= 80 ? '400-445' : score >= 70 ? '350-395' : score >= 60 ? '300-345' : 'Below 300'
    }
  }
}

function resetTest() {
  hasStarted.value = false
  isComplete.value = false
  result.value = null
  answers.value = new Map()
  currentSection.value = 'part5'
  currentIndex.value = 0
  part5Questions.value = []
  part6Passages.value = []
  part7Passages.value = []
  timer.reset()
}

// Navigation
function navTo(section: 'part5' | 'part6' | 'part7', index: number) {
  currentSection.value = section
  currentIndex.value = index
}

function nextQuestion() {
  if (currentSection.value === 'part5') {
    if (currentIndex.value < part5Questions.value.length - 1) {
      currentIndex.value++
    } else {
      currentSection.value = 'part6'
      currentIndex.value = 0
    }
  } else if (currentSection.value === 'part6') {
    if (currentIndex.value < part6Passages.value.length - 1) {
      currentIndex.value++
    } else {
      currentSection.value = 'part7'
      currentIndex.value = 0
    }
  } else {
    if (currentIndex.value < part7Passages.value.length - 1) {
      currentIndex.value++
    }
  }
}

function timeDisplay(): string {
  const totalSec = timer.elapsed.value
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}m ${s}s`
}
</script>

<template>
  <div class="mock-test-view">
    <!-- Start screen -->
    <div v-if="!hasStarted && !isComplete" class="start-screen">
      <h1>TOEIC Mock Test</h1>
      <p class="desc">Simulate a real TOEIC Reading test with 75-minute timer. No immediate feedback - answers are graded at the end.</p>
      <ul class="test-info">
        <li>Part 5: Incomplete Sentences (30 questions)</li>
        <li>Part 6: Text Completion (8 passages)</li>
        <li>Part 7: Reading Comprehension (10 passages)</li>
        <li>Time limit: 75 minutes</li>
      </ul>
      <Button label="Start Mock Test" icon="pi pi-play" @click="startTest" :loading="isLoading" size="large" />
    </div>

    <!-- Results -->
    <MockTestResult
      v-else-if="isComplete && result"
      :result="result"
      :time-display="timeDisplay()"
      @restart="resetTest"
      @view-stats="router.push('/stats')"
    />

    <!-- Test in progress -->
    <div v-else-if="hasStarted">
      <!-- Header -->
      <div class="test-header">
        <TimerDisplay :display="timer.display.value" :is-expired="timer.isExpired.value" :progress-percent="timer.progressPercent.value" />
        <div class="test-progress">{{ answeredCount }} / {{ totalQuestions }} answered</div>
        <Button label="Submit Test" icon="pi pi-check" severity="danger" size="small" @click="confirmSubmit" />
      </div>

      <!-- Section tabs -->
      <div class="section-tabs">
        <button
          :class="['tab', { active: currentSection === 'part5' }]"
          @click="navTo('part5', 0)"
        >Part 5</button>
        <button
          :class="['tab', { active: currentSection === 'part6' }]"
          @click="navTo('part6', 0)"
        >Part 6</button>
        <button
          :class="['tab', { active: currentSection === 'part7' }]"
          @click="navTo('part7', 0)"
        >Part 7</button>
      </div>

      <!-- Part 5 -->
      <div v-if="currentSection === 'part5' && currentPart5" class="question-area">
        <div class="q-nav">
          <button
            v-for="(q, i) in part5Questions"
            :key="q.id"
            :class="['nav-dot', { current: i === currentIndex, answered: answers.has(q.id) }]"
            @click="currentIndex = i"
          >{{ i + 1 }}</button>
        </div>

        <div class="mock-question">
          <p class="q-num">Question {{ currentIndex + 1 }} / {{ part5Questions.length }}</p>
          <p class="sentence">{{ currentPart5.sentence }}</p>
          <div class="options">
            <button
              v-for="(opt, oi) in currentPart5.options"
              :key="oi"
              :class="['option-btn', { selected: answers.get(currentPart5.id)?.user_answer === opt }]"
              @click="selectAnswer(currentPart5.id, '5', opt, currentPart5.answer)"
            >
              <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
              {{ opt }}
            </button>
          </div>
          <div class="q-actions">
            <Button label="Next" icon="pi pi-arrow-right" @click="nextQuestion" size="small" text />
          </div>
        </div>
      </div>

      <!-- Part 6 -->
      <div v-if="currentSection === 'part6' && currentPart6" class="question-area">
        <div class="q-nav">
          <button
            v-for="(p, i) in part6Passages"
            :key="p.id"
            :class="['nav-dot', { current: i === currentIndex }]"
            @click="currentIndex = i"
          >{{ i + 1 }}</button>
        </div>

        <div class="mock-passage">
          <p class="q-num">Passage {{ currentIndex + 1 }} / {{ part6Passages.length }}</p>
          <div class="passage-box">
            <pre class="passage-text">{{ currentPart6.passage }}</pre>
          </div>
          <div v-for="(q, qi) in currentPart6.questions" :key="qi" class="sub-question">
            <p class="sub-q-label">Blank ({{ q.blank_number }})</p>
            <div class="options">
              <button
                v-for="(opt, oi) in q.options"
                :key="oi"
                :class="['option-btn', { selected: answers.get(`${currentPart6.id}_q${qi+1}`)?.user_answer === opt }]"
                @click="selectAnswer(`${currentPart6.id}_q${qi+1}`, '6', opt, String(q.answer))"
              >
                <span class="opt-letter">{{ oi + 1 }}</span>
                {{ opt }}
              </button>
            </div>
          </div>
          <div class="q-actions">
            <Button label="Next Passage" icon="pi pi-arrow-right" @click="nextQuestion" size="small" text />
          </div>
        </div>
      </div>

      <!-- Part 7 -->
      <div v-if="currentSection === 'part7' && currentPart7" class="question-area">
        <div class="q-nav">
          <button
            v-for="(p, i) in part7Passages"
            :key="p.id"
            :class="['nav-dot', { current: i === currentIndex }]"
            @click="currentIndex = i"
          >{{ i + 1 }}</button>
        </div>

        <div class="mock-passage">
          <p class="q-num">Passage {{ currentIndex + 1 }} / {{ part7Passages.length }}</p>
          <div class="passage-box">
            <pre class="passage-text">{{ currentPart7.passage }}</pre>
          </div>
          <div v-for="(q, qi) in currentPart7.questions" :key="qi" class="sub-question">
            <p class="sub-q-label">Q{{ qi + 1 }}. {{ q.question }}</p>
            <div class="options">
              <button
                v-for="(opt, oi) in q.options"
                :key="oi"
                :class="['option-btn', { selected: answers.get(`${currentPart7.id}_q${qi+1}`)?.user_answer === String(oi+1) }]"
                @click="selectAnswer(`${currentPart7.id}_q${qi+1}`, '7', String(oi+1), String(q.answer))"
              >
                <span class="opt-letter">{{ oi + 1 }}</span>
                {{ opt }}
              </button>
            </div>
          </div>
          <div class="q-actions">
            <Button label="Next Passage" icon="pi pi-arrow-right" @click="nextQuestion" size="small" text />
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm dialog -->
    <Dialog v-model:visible="showConfirmDialog" header="Submit Test?" :modal="true" :closable="true" :style="{ width: '400px' }">
      <p>You have answered {{ answeredCount }} of {{ totalQuestions }} questions.</p>
      <p v-if="answeredCount < totalQuestions">There are {{ totalQuestions - answeredCount }} unanswered questions. Submit anyway?</p>
      <template #footer>
        <Button label="Cancel" @click="showConfirmDialog = false" text />
        <Button label="Submit" icon="pi pi-check" @click="submitTest" severity="danger" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.mock-test-view {
  max-width: 800px;
  margin: 0 auto;
}

.start-screen {
  text-align: center;
  padding: 48px 0;
}

.start-screen h1 {
  margin-bottom: 16px;
}

.desc {
  color: var(--p-text-muted-color);
  margin-bottom: 24px;
}

.test-info {
  text-align: left;
  max-width: 400px;
  margin: 0 auto 32px;
  list-style: none;
  padding: 0;
}

.test-info li {
  padding: 8px 0;
  border-bottom: 1px solid var(--p-surface-border);
}

.test-info li::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--p-primary-color);
  margin-right: 12px;
}

.test-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.test-progress {
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.section-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 2px solid var(--p-surface-border);
}

.tab {
  padding: 8px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  color: var(--p-text-muted-color);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab.active {
  color: var(--p-primary-color);
  border-bottom-color: var(--p-primary-color);
}

.q-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 16px;
}

.nav-dot {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--p-surface-border);
  background: var(--p-surface-card);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
}

.nav-dot.current {
  border-color: var(--p-primary-color);
  background: var(--p-primary-50);
}

.nav-dot.answered {
  background: var(--p-primary-color);
  color: white;
  border-color: var(--p-primary-color);
}

.question-area {
  background: var(--p-surface-card);
  border: 1px solid var(--p-surface-border);
  border-radius: 12px;
  padding: 24px;
}

.q-num {
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
  margin-bottom: 16px;
}

.sentence {
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 2px solid var(--p-surface-border);
  border-radius: 8px;
  background: var(--p-surface-card);
  cursor: pointer;
  text-align: left;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.option-btn:hover { border-color: var(--p-primary-color); }
.option-btn.selected { border-color: var(--p-primary-color); background: var(--p-primary-50); }

.opt-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--p-surface-100);
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.q-actions {
  text-align: right;
}

.passage-box {
  background: var(--p-surface-50);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.passage-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 0.9375rem;
  line-height: 1.7;
  margin: 0;
}

.sub-question {
  padding-top: 16px;
  border-top: 1px solid var(--p-surface-border);
  margin-bottom: 16px;
}

.sub-q-label {
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
