import { ref } from 'vue'
import { getAnalyticsData } from '../../../data/repositories/analyticsRepository.js'
import { friendlyError } from '../../../shared/utils/errors.js'

export function useChartsData() {
  const data = ref(createEmptyAnalyticsData())
  const error = ref('')
  const loading = ref(true)

  async function load() {
    loading.value = true
    error.value = ''

    try {
      data.value = await getAnalyticsData()
    } catch (loadError) {
      error.value = friendlyError(loadError)
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, load }
}

function createEmptyAnalyticsData() {
  return {
    bodyMeasurements: [],
    categories: [],
    exercises: [],
    workoutSets: [],
    workoutTimes: [],
  }
}
