import { computed, ref } from 'vue'
import { getExerciseCatalog } from '../../../data/repositories/workoutRepository'

export function useExerciseCatalog() {
  const categories = ref([])
  const exercises = ref([])
  const loading = ref(false)
  const error = ref('')
  const searchQuery = ref('')
  const selectedCategoryId = ref(null)
  const filteredExercises = computed(buildFilteredExercises)

  async function load() {
    loading.value = true
    error.value = ''

    try {
      const catalog = await getExerciseCatalog()
      exercises.value = catalog.exercises
      categories.value = catalog.categories
    } catch {
      error.value = 'Exercises could not be loaded from local storage.'
    } finally {
      loading.value = false
    }
  }

  function findById(exerciseId) {
    for (const exercise of exercises.value) {
      if (exercise.id === exerciseId) return exercise
    }

    return null
  }

  function hasExercises() {
    return exercises.value.length > 0
  }

  function resetFilters() {
    searchQuery.value = ''
    selectedCategoryId.value = null
  }

  function buildFilteredExercises() {
    const filtered = []
    const query = searchQuery.value.trim().toLowerCase()

    for (const exercise of exercises.value) {
      const categoryMatches =
        selectedCategoryId.value === null ||
        exercise.categoryId === selectedCategoryId.value
      const searchMatches =
        !query ||
        exercise.name.toLowerCase().includes(query)

      if (categoryMatches && searchMatches) filtered.push(exercise)
    }

    return filtered
  }

  return {
    categories,
    error,
    filteredExercises,
    loading,
    searchQuery,
    selectedCategoryId,
    findById,
    hasExercises,
    load,
    resetFilters,
  }
}
