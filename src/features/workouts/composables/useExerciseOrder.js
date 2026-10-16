import { computed, ref } from 'vue'
import { reorderWorkoutExercises } from '../../../data/repositories/workoutRepository.js'

export function useExerciseOrder() {
  const exercises = ref([])
  const saving = ref(false)
  const error = ref('')
  const changed = computed(readChanged)
  let original = []
  let date = ''

  function open(items, selectedDate) {
    original = [...items]
    exercises.value = [...items]
    date = selectedDate
    error.value = ''
  }

  function readChanged() {
    return exercises.value.some(isDifferent)
  }

  function isDifferent(exercise, index) {
    return exercise.id !== original[index]?.id
  }

  function originalPosition(exerciseId) {
    for (let index = 0; index < original.length; index += 1) {
      if (original[index].id === exerciseId) return index + 1
    }
    return null
  }

  function move(index, direction) {
    const target = index + direction
    if (saving.value || target < 0 || target >= exercises.value.length) return
    const items = [...exercises.value]
    const exercise = items[index]
    items[index] = items[target]
    items[target] = exercise
    exercises.value = items
  }

  function reset() {
    exercises.value = [...original]
    error.value = ''
  }

  async function save() {
    if (saving.value) return false
    if (!changed.value) return true
    saving.value = true
    error.value = ''
    try {
      await reorderWorkoutExercises(date, exercises.value.map(readId))
      return true
    } catch {
      error.value = 'Exercise order could not be saved. Please try again.'
      return false
    } finally {
      saving.value = false
    }
  }

  function readId(exercise) {
    return exercise.id
  }

  return { exercises, changed, saving, error, open, move, reset, save, originalPosition }
}
