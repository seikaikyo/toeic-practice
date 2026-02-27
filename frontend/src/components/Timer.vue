<script setup lang="ts">
defineProps<{
  display: string
  isExpired: boolean
  progressPercent: number
}>()
</script>

<template>
  <div class="timer" :class="{ expired: isExpired, warning: progressPercent > 80 && !isExpired }">
    <i class="pi pi-clock"></i>
    <span class="timer-display">{{ display }}</span>
  </div>
</template>

<style scoped>
.timer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--p-surface-100);
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.timer.warning {
  background: var(--p-yellow-50);
  color: var(--p-yellow-700);
}

.timer.expired {
  background: var(--p-red-50);
  color: var(--p-red-700);
}
</style>
