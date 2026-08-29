import { ref } from 'vue'
import { useExerciseCatalog } from './useExerciseCatalog'
import { useExerciseSets } from './useExerciseSets'

export function useExerciseEditor(selectedDate, callbacks = {}) {
  const step = ref('exercise')
  const catalog = useExerciseCatalog()
  const sets = useExerciseSets(selectedDate, callbacks)

  async function startPicker() {
    reset()
    await catalog.load()
  }

  async function startEditor(dayExercise) {
    if (!catalog.hasExercises()) await catalog.load()

    const exercise =
      catalog.findById(dayExercise.id) ??
      createExerciseFallback(dayExercise)

    await openEditor(exercise)
  }

  async function openEditor(exercise) {
    step.value = 'sets'
    await sets.open(exercise)
  }

  function reset() {
    step.value = 'exercise'
    catalog.resetFilters()
    sets.reset()
  }

  return {
    canSave: sets.canSave,
    categories: catalog.categories,
    deleteConfirming: sets.deleteConfirming,
    draftSets: sets.draftSets,
    error: sets.error,
    filteredExercises: catalog.filteredExercises,
    hasExistingSets: sets.hasExistingSets,
    loading: catalog.loading,
    saving: sets.saving,
    searchQuery: catalog.searchQuery,
    selectedCategoryId: catalog.selectedCategoryId,
    selectedExercise: sets.selectedExercise,
    step,
    title: sets.title,
    addSet: sets.addSet,
    openEditor,
    removeExercise: sets.removeExercise,
    removeSet: sets.removeSet,
    reset,
    save: sets.save,
    startEditor,
    startPicker,
    updateSet: sets.updateSet,
  }
}

function createExerciseFallback(exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    categoryName: 'Exercise',
    categoryColor: null,
  }
}
