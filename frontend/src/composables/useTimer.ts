import { ref, computed, onUnmounted } from 'vue'

export function useTimer(totalSeconds: number = 75 * 60) {
  const remaining = ref(totalSeconds)
  const isRunning = ref(false)
  const isExpired = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  const minutes = computed(() => Math.floor(remaining.value / 60))
  const seconds = computed(() => remaining.value % 60)
  const display = computed(() => {
    const m = String(minutes.value).padStart(2, '0')
    const s = String(seconds.value).padStart(2, '0')
    return `${m}:${s}`
  })
  const elapsed = computed(() => totalSeconds - remaining.value)
  const progressPercent = computed(() => Math.round((1 - remaining.value / totalSeconds) * 100))

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    intervalId = setInterval(() => {
      if (remaining.value <= 0) {
        stop()
        isExpired.value = true
        return
      }
      remaining.value--
    }, 1000)
  }

  function stop() {
    isRunning.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function reset(newTotal?: number) {
    stop()
    remaining.value = newTotal ?? totalSeconds
    isExpired.value = false
  }

  onUnmounted(() => {
    stop()
  })

  return {
    remaining,
    isRunning,
    isExpired,
    minutes,
    seconds,
    display,
    elapsed,
    progressPercent,
    start,
    stop,
    reset
  }
}
