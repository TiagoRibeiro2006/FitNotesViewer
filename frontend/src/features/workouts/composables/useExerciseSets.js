import { computed, ref } from 'vue'
import {
  deleteWorkoutExercise,
  getPreviousWorkoutSetsForExercise,
  getWorkoutSetsForDateExercise,
  saveWorkoutExercise,
} from '../../../data/repositories/workoutRepository'
import { friendlyError } from '../../../shared/utils/errors'
import {
  createEmptySetDrafts,
  createNextSetDraft,
  createSetDrafts,
  validateSetDrafts,
} from '../exerciseSetDrafts'

export function useExerciseSets(selectedDate, callbacks = {}) {
  const saving = ref(false)
  const error = ref('')
  const selectedExercise = ref(null)
  const draftSets = ref([])
  const previousSets = ref([])
  const hasExistingSets = ref(false)
  const deleteConfirming = ref(false)
  const title = computed(readTitle)
  const canSave = computed(canSaveDrafts)

  async function open(exercise) {
    selectedExercise.value = exercise
    resetDrafts()

    try {
      const result = await Promise.all([
        getWorkoutSetsForDateExercise(selectedDate.value, exercise.id),
        getPreviousWorkoutSetsForExercise(exercise.id, selectedDate.value),
      ])
      const currentSets = result[0]
      const previous = result[1]

      hasExistingSets.value = currentSets.length > 0
      previousSets.value = previous.sets
      draftSets.value = chooseDraftSets(currentSets, previous.sets)
    } catch {
      error.value = 'Workout history for this exercise could not be loaded.'
      draftSets.value = createEmptySetDrafts()
    }
  }

  function addSet() {
    draftSets.value.push(
      createNextSetDraft(draftSets.value, previousSets.value),
    )
  }

  function removeSet(index) {
    if (draftSets.value.length <= 1) {
      draftSets.value[0].weight = ''
      draftSets.value[0].reps = ''
      return
    }

    draftSets.value.splice(index, 1)
  }

  function moveSet(fromIndex, toIndex) {
    if (fromIndex === toIndex) return
    const [set] = draftSets.value.splice(fromIndex, 1)
    draftSets.value.splice(toIndex, 0, set)
    deleteConfirming.value = false
  }

  function updateSet(index, field, value) {
    const set = draftSets.value[index]
    if (!set || !isEditableField(field)) return

    set[field] = value
    deleteConfirming.value = false
  }

  async function save() {
    if (!selectedExercise.value || !canSave.value || saving.value) return
    saving.value = true
    error.value = ''

    try {
      const summary = await saveWorkoutExercise(
        selectedDate.value,
        selectedExercise.value,
        draftSets.value,
      )
      callbacks.onChanged?.(summary)
      callbacks.onClose?.()
    } catch (saveError) {
      error.value = friendlyError(saveError)
    } finally {
      saving.value = false
    }
  }

  async function removeExercise() {
    if (!selectedExercise.value || !hasExistingSets.value || saving.value) return

    if (!deleteConfirming.value) {
      deleteConfirming.value = true
      return
    }

    saving.value = true
    error.value = ''

    try {
      const summary = await deleteWorkoutExercise(
        selectedDate.value,
        selectedExercise.value.id,
      )
      callbacks.onChanged?.(summary)
      callbacks.onClose?.()
    } catch (deleteError) {
      error.value = friendlyError(deleteError)
    } finally {
      saving.value = false
    }
  }

  function reset() {
    selectedExercise.value = null
    resetDrafts()
  }

  function resetDrafts() {
    error.value = ''
    hasExistingSets.value = false
    deleteConfirming.value = false
    draftSets.value = []
    previousSets.value = []
  }

  function readTitle() {
    return hasExistingSets.value ? 'Edit exercise' : 'Log exercise'
  }

  function canSaveDrafts() {
    return validateSetDrafts(draftSets.value)
  }

  return {
    canSave,
    deleteConfirming,
    draftSets,
    error,
    hasExistingSets,
    saving,
    selectedExercise,
    title,
    addSet,
    open,
    moveSet,
    removeExercise,
    removeSet,
    reset,
    save,
    updateSet,
  }
}

function chooseDraftSets(currentSets, previousSets) {
  if (currentSets.length) return createSetDrafts(currentSets)
  if (previousSets.length) return createSetDrafts(previousSets)
  return createEmptySetDrafts()
}

function isEditableField(field) {
  return field === 'weight' || field === 'reps'
}
