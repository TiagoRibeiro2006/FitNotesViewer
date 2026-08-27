import { ref } from 'vue'
import { useExerciseCatalog } from './useExerciseCatalog'
import { useExerciseDetails } from './useExerciseDetails'
import { useExerciseSets } from './useExerciseSets'

export function useExerciseEditor(selectedDate, callbacks = {}) {
  const step = ref('exercise')
  const catalog = useExerciseCatalog()
  const details = useExerciseDetails()
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

  function openExerciseDetails() {
    if (sets.selectedExercise.value) step.value = 'exercise-details'
  }

  async function saveExerciseDetails(changes) {
    const exercise = sets.selectedExercise.value
    if (!exercise) return

    const result = await details.save(exercise.id, changes)
    if (!result?.exercise) return

    await catalog.load()
    sets.replaceExercise(catalog.findById(exercise.id) ?? result.exercise)
    step.value = 'sets'
    callbacks.onChanged?.(result.summary)
  }

  function returnToSets() {
    details.reset()
    step.value = 'sets'
  }

  function reset() {
    step.value = 'exercise'
    catalog.resetFilters()
    details.reset()
    sets.reset()
  }

  return {
    canSave: sets.canSave,
    categories: catalog.categories,
    deleteConfirming: sets.deleteConfirming,
    detailsError: details.error,
    detailsSaving: details.saving,
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
    moveSet: sets.moveSet,
    openEditor,
    openExerciseDetails,
    removeExercise: sets.removeExercise,
    removeSet: sets.removeSet,
    reset,
    save: sets.save,
    saveExerciseDetails,
    startEditor,
    startPicker,
    returnToSets,
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
