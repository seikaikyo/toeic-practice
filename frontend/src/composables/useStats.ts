import { ref } from 'vue'
import { useApi } from './useApi'
import type { StatsOverview, SessionHistory } from '../types'

export function useStats() {
  const api = useApi()
  const overview = ref<StatsOverview | null>(null)
  const history = ref<SessionHistory[]>([])
  const isLoading = ref(false)

  async function loadStats() {
    isLoading.value = true
    try {
      const [overviewData, historyData] = await Promise.all([
        api.get<StatsOverview>('/stats'),
        api.get<SessionHistory[]>('/stats/history?limit=20')
      ])
      overview.value = overviewData
      history.value = historyData
    } catch (e) {
      console.error('Failed to load stats:', e)
    } finally {
      isLoading.value = false
    }
  }

  return {
    overview,
    history,
    isLoading,
    loadStats
  }
}
