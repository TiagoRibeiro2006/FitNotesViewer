import { ref } from 'vue'
import {
  getBodyMeasurementHistory,
  saveBodyMeasurementValue,
} from '../../../data/repositories/bodyRepository'
import { friendlyError } from '../../../shared/utils/errors'

export function useBodyMeasurementDetails() {
  const history = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  async function load(item) {
    loading.value = true
    error.value = ''

    try {
      history.value = await getBodyMeasurementHistory(item)
    } catch (loadError) {
      error.value = friendlyError(loadError)
    } finally {
      loading.value = false
    }
  }

  async function addValue(item, value) {
    if (saving.value) return false
    saving.value = true
    error.value = ''

    try {
      await saveBodyMeasurementValue(item, value)
      await load(item)
      return true
    } catch (saveError) {
      error.value = friendlyError(saveError)
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    error,
    history,
    loading,
    saving,
    addValue,
    load,
  }
}
