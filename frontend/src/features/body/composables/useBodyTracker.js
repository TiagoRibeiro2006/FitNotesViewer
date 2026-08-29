import { computed, ref } from 'vue'
import {
  deleteBodyMeasurement,
  getBodyTrackerData,
  saveBodyFavoriteIds,
  updateBodyMeasurementName,
} from '../../../data/repositories/bodyRepository'

export function useBodyTracker() {
  const favorites = ref([])
  const measurements = ref([])
  const loading = ref(false)
  const error = ref('')
  const favoritesSaving = ref(false)
  const managementSaving = ref(false)

  const sections = computed(() => [
    { id: 'favorites', label: 'Favorites', items: favorites.value, emptyMessage: 'No favorites yet.' },
    { id: 'measurements', label: 'All Measurements', items: measurements.value, emptyMessage: 'No other measurements yet.' },
  ])

  async function load() {
    loading.value = true
    error.value = ''

    try {
      applyTrackerData(await getBodyTrackerData())
    } catch {
      error.value = 'Body data could not be loaded from local storage.'
    } finally {
      loading.value = false
    }
  }

  async function toggleFavorite(item) {
    if (favoritesSaving.value) return
    favoritesSaving.value = true
    error.value = ''

    try {
      const favoriteIds = favorites.value.map((favorite) => favorite.id)
      const nextIds = item.favorite
        ? favoriteIds.filter((id) => id !== item.id)
        : [...favoriteIds, item.id]
      await saveBodyFavoriteIds(nextIds)
      applyTrackerData(await getBodyTrackerData())
    } catch {
      error.value = 'Favorites could not be updated in local storage.'
    } finally {
      favoritesSaving.value = false
    }
  }

  async function removeMeasurement(item) {
    if (managementSaving.value) return
    managementSaving.value = true
    error.value = ''

    try {
      applyTrackerData(await deleteBodyMeasurement(item))
    } catch {
      error.value = 'Measurement could not be deleted from local storage.'
    } finally {
      managementSaving.value = false
    }
  }

  async function renameMeasurement(payload) {
    if (managementSaving.value) return
    managementSaving.value = true
    error.value = ''

    try {
      applyTrackerData(await updateBodyMeasurementName(payload.item, payload.name))
    } catch {
      error.value = 'Measurement name could not be updated in local storage.'
    } finally {
      managementSaving.value = false
    }
  }

  function applyTrackerData(data) {
    favorites.value = data.favorites
    measurements.value = data.measurements
  }

  return {
    error,
    favoritesSaving,
    loading,
    managementSaving,
    removeMeasurement,
    renameMeasurement,
    sections,
    load,
    toggleFavorite,
  }
}
