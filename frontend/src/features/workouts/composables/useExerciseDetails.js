import { ref } from 'vue'
import { updateExerciseDetails } from '../../../data/repositories/catalogRepository'
import { friendlyError } from '../../../shared/utils/errors'

export function useExerciseDetails() {
  const error = ref('')
  const saving = ref(false)

  async function save(exerciseId, details) {
    if (saving.value) return null
    saving.value = true
    error.value = ''

    try {
      return await updateExerciseDetails(exerciseId, details)
    } catch (saveError) {
      error.value = friendlyError(saveError)
      return null
    } finally {
      saving.value = false
    }
  }

  function reset() {
    error.value = ''
    saving.value = false
  }

  return { error, saving, reset, save }
}
