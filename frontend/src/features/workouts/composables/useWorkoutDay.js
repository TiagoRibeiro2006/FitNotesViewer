import { ref } from 'vue'
import { getWorkoutSetsForDate } from '../../../data/repositories/workoutRepository'
import { groupWorkoutSetsByExercise } from '../workoutMappers'

export function useWorkoutDay(selectedDate) {
  const exercises = ref([])
  const loading = ref(false)
  const error = ref('')
  let loadSequence = 0

  async function load() {
    const sequence = ++loadSequence
    loading.value = true
    error.value = ''

    try {
      const sets = await getWorkoutSetsForDate(selectedDate.value)
      if (sequence !== loadSequence) return
      exercises.value = groupWorkoutSetsByExercise(sets)
    } catch {
      if (sequence !== loadSequence) return
      exercises.value = []
      error.value = 'Workout data could not be loaded.'
    } finally {
      if (sequence === loadSequence) loading.value = false
    }
  }

  return {
    error,
    exercises,
    loading,
    load,
  }
}
