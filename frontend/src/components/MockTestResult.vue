<script setup lang="ts">
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import type { SessionResult } from '../types'

const props = defineProps<{
  result: SessionResult
  timeDisplay: string
}>()

defineEmits<{
  restart: []
  viewStats: []
}>()

function getScoreColor(score: number): 'success' | 'warn' | 'danger' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warn'
  return 'danger'
}
</script>

<template>
  <div class="mock-result">
    <h2>Mock Test Results</h2>

    <div class="result-summary">
      <div class="big-score">
        <span class="score-num">{{ result.score }}%</span>
        <span class="score-fraction">{{ result.correct_count }} / {{ result.total_questions }} correct</span>
      </div>

      <div v-if="result.estimated_toeic_score" class="toeic-estimate">
        <span class="estimate-label">Estimated TOEIC Reading Score</span>
        <Tag :value="result.estimated_toeic_score" :severity="getScoreColor(result.score)" class="estimate-tag" />
      </div>

      <div class="time-info">
        <i class="pi pi-clock"></i>
        <span>Time: {{ timeDisplay }}</span>
      </div>
    </div>

    <div class="result-actions">
      <Button label="Try Again" icon="pi pi-refresh" @click="$emit('restart')" outlined />
      <Button label="View Stats" icon="pi pi-chart-bar" @click="$emit('viewStats')" />
    </div>
  </div>
</template>

<style scoped>
.mock-result {
  text-align: center;
  padding: 48px 0;
}

.mock-result h2 {
  margin-bottom: 32px;
}

.result-summary {
  margin-bottom: 32px;
}

.big-score {
  margin-bottom: 24px;
}

.score-num {
  display: block;
  font-size: 3rem;
  font-weight: 700;
}

.score-fraction {
  font-size: 1rem;
  color: var(--p-text-muted-color);
}

.toeic-estimate {
  margin-bottom: 16px;
}

.estimate-label {
  display: block;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
  margin-bottom: 8px;
}

.estimate-tag {
  font-size: 1.25rem;
  padding: 8px 24px;
}

.time-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--p-text-muted-color);
}

.result-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
