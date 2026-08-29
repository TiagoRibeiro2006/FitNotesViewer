import { ref } from 'vue'
import { getWorkoutSetsForDate, reorderWorkoutExercises } from '../../../data/repositories/workoutRepository'
import { groupWorkoutSetsByExercise } from '../workoutMappers'

export function useWorkoutDay(selectedDate) {
  const exercises = ref([])
  const loading = ref(true)
  const reordering = ref(false)
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

  function moveExercise(fromIndex, toIndex) {
    if (fromIndex === toIndex) return
    const [exercise] = exercises.value.splice(fromIndex, 1)
    exercises.value.splice(toIndex, 0, exercise)
  }

  async function saveExerciseOrder() {
    if (reordering.value) return
    reordering.value = true
    error.value = ''

    try {
      await reorderWorkoutExercises(selectedDate.value, exercises.value.map((exercise) => exercise.id))
    } catch {
      error.value = 'Exercise order could not be saved.'
      await load()
    } finally {
      reordering.value = false
    }
  }

  return {
    error,
    exercises,
    loading,
    reordering,
    load,
    moveExercise,
    saveExerciseOrder,
  }
}
