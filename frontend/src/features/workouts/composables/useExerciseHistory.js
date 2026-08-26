import { ref } from 'vue'
import { getWorkoutHistoryForExercise } from '../../../data/repositories/workoutRepository'

export function useExerciseHistory() {
  const days = ref([])
  const error = ref('')
  const loading = ref(false)
  let requestId = 0

  async function load(exerciseId) {
    const currentRequestId = ++requestId
    days.value = []
    error.value = ''
    loading.value = true

    try {
      const history = await getWorkoutHistoryForExercise(exerciseId)
      if (currentRequestId === requestId) days.value = history
    } catch {
      if (currentRequestId === requestId) error.value = 'Could not load exercise history.'
    } finally {
      if (currentRequestId === requestId) loading.value = false
    }
  }

  return { days, error, loading, load }
}
