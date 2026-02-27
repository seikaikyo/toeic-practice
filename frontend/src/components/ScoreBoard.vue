<script setup lang="ts">
import Button from 'primevue/button'
import type { SessionResult } from '../types'

defineProps<{
  result: SessionResult
}>()

defineEmits<{
  restart: []
}>()

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--p-green-500)'
  if (score >= 60) return 'var(--p-yellow-500)'
  return 'var(--p-red-500)'
}
</script>

<template>
  <div class="score-board">
    <h2>Practice Complete!</h2>

    <div class="score-circle" :style="{ borderColor: scoreColor(result.score) }">
      <span class="score-value">{{ result.score }}%</span>
      <span class="score-detail">{{ result.correct_count }} / {{ result.total_questions }}</span>
    </div>

    <div class="score-meta">
      <div class="meta-item">
        <span class="meta-label">Mode</span>
        <span class="meta-value">{{ result.mode }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Part</span>
        <span class="meta-value">{{ result.part }}</span>
      </div>
    </div>

    <Button label="Practice Again" icon="pi pi-refresh" @click="$emit('restart')" class="restart-btn" />
  </div>
</template>

<style scoped>
.score-board {
  text-align: center;
  padding: 48px 0;
}

.score-board h2 {
  margin-bottom: 32px;
}

.score-circle {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  border: 6px solid;
  margin-bottom: 24px;
}

.score-value {
  font-size: 2rem;
  font-weight: 700;
}

.score-detail {
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.score-meta {
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-bottom: 32px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.meta-value {
  font-weight: 600;
  text-transform: capitalize;
}

.restart-btn {
  min-width: 200px;
}
</style>
