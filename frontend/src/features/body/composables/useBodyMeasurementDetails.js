import { ref } from 'vue'
import {
  deleteBodyMeasurementRecord,
  getBodyMeasurementHistory,
  saveBodyMeasurementValue,
  updateBodyMeasurementRecord,
} from '../../../data/repositories/bodyRepository'
import { friendlyError } from '../../../shared/utils/errors'

export function useBodyMeasurementDetails() {
  const history = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const recordSaving = ref(false)
  const error = ref('')
  const recordError = ref('')

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

  async function addValue(item, value, date, time) {
    if (saving.value) return false
    saving.value = true
    error.value = ''

    try {
      await saveBodyMeasurementValue(item, value, date, time)
      await load(item)
      return true
    } catch (saveError) {
      error.value = friendlyError(saveError)
      return false
    } finally {
      saving.value = false
    }
  }

  async function updateValue(item, record, value) {
    if (recordSaving.value) return false
    recordSaving.value = true
    recordError.value = ''

    try {
      await updateBodyMeasurementRecord(record, value)
      await load(item)
      return true
    } catch (updateError) {
      recordError.value = friendlyError(updateError)
      return false
    } finally {
      recordSaving.value = false
    }
  }

  async function deleteValue(item, record) {
    if (recordSaving.value) return false
    recordSaving.value = true
    recordError.value = ''

    try {
      await deleteBodyMeasurementRecord(record)
      await load(item)
      return true
    } catch (deleteError) {
      recordError.value = friendlyError(deleteError)
      return false
    } finally {
      recordSaving.value = false
    }
  }

  function clearRecordError() {
    recordError.value = ''
  }

  return {
    error,
    history,
    loading,
    recordError,
    recordSaving,
    saving,
    addValue,
    clearRecordError,
    deleteValue,
    load,
    updateValue,
  }
}
