import { computed, ref } from 'vue'
import {
  deleteWorkoutExercise,
  getExerciseCatalog,
  getPreviousWorkoutSetsForExercise,
  getWorkoutSetsForDateExercise,
  saveWorkoutExercise,
} from '../../../data/repositories/workoutRepository'
import { friendlyError } from '../../../shared/utils/errors'

export function useExerciseEditor(selectedDate, callbacks = {}) {
  const step = ref('exercise')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const searchQuery = ref('')
  const selectedCategoryId = ref(null)
  const exercises = ref([])
  const categories = ref([])
  const selectedExercise = ref(null)
  const draftSets = ref([])
  const previousSets = ref([])
  const hasExistingSets = ref(false)
  const deleteConfirming = ref(false)

  const filteredExercises = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return exercises.value.filter((exercise) => {
      const matchesCategory = selectedCategoryId.value === null || exercise.categoryId === selectedCategoryId.value
      const matchesSearch = !query || exercise.name.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  })

  const title = computed(() => hasExistingSets.value ? 'Edit exercise' : 'Log exercise')
  const canSave = computed(() => validateDraftSets(draftSets.value))

  async function startPicker() {
    reset()
    step.value = 'exercise'
    await loadCatalog()
  }

  async function startEditor(dayExercise) {
    error.value = ''

    try {
      if (!exercises.value.length) await loadCatalog()
      const exercise = exercises.value.find((item) => item.id === dayExercise.id) ?? exerciseFallback(dayExercise)
      await openEditor(exercise)
    } catch {
      await openEditor(exerciseFallback(dayExercise))
    }
  }

  async function loadCatalog() {
    loading.value = true

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

  async function openEditor(exercise) {
    selectedExercise.value = exercise
    step.value = 'sets'
    resetEditor()

    try {
      const [currentSets, previous] = await Promise.all([
        getWorkoutSetsForDateExercise(selectedDate.value, exercise.id),
        getPreviousWorkoutSetsForExercise(exercise.id, selectedDate.value),
      ])

      hasExistingSets.value = currentSets.length > 0
      previousSets.value = previous.sets

      if (currentSets.length) {
        draftSets.value = mapSets(currentSets)
      } else if (previous.sets.length) {
        draftSets.value = mapSets(previous.sets)
      } else {
        draftSets.value = createEmptySets()
      }
    } catch {
      error.value = 'Workout history for this exercise could not be loaded.'
      draftSets.value = createEmptySets()
    }
  }

  function addSet() {
    const index = draftSets.value.length
    const previous = previousSets.value[index]
    const last = draftSets.value[index - 1]

    draftSets.value.push({
      weight: previous?.weight ?? last?.weight ?? '',
      reps: previous?.reps ?? last?.reps ?? '',
    })
  }

  function removeSet(index) {
    if (draftSets.value.length <= 1) {
      draftSets.value[0] = { weight: '', reps: '' }
      return
    }

    draftSets.value.splice(index, 1)
  }

  function updateSet(index, field, value) {
    const set = draftSets.value[index]
    if (!set || !['weight', 'reps'].includes(field)) return
    set[field] = value
    deleteConfirming.value = false
  }

  async function save() {
    if (!selectedExercise.value || !canSave.value || saving.value) return
    saving.value = true
    error.value = ''

    try {
      const summary = await saveWorkoutExercise(selectedDate.value, selectedExercise.value, draftSets.value)
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
      const summary = await deleteWorkoutExercise(selectedDate.value, selectedExercise.value.id)
      callbacks.onChanged?.(summary)
      callbacks.onClose?.()
    } catch (deleteError) {
      error.value = friendlyError(deleteError)
    } finally {
      saving.value = false
    }
  }

  function reset() {
    step.value = 'exercise'
    searchQuery.value = ''
    selectedCategoryId.value = null
    selectedExercise.value = null
    resetEditor()
  }

  function resetEditor() {
    error.value = ''
    hasExistingSets.value = false
    deleteConfirming.value = false
    draftSets.value = []
    previousSets.value = []
  }

  return {
    canSave,
    categories,
    deleteConfirming,
    draftSets,
    error,
    filteredExercises,
    hasExistingSets,
    loading,
    saving,
    searchQuery,
    selectedCategoryId,
    selectedExercise,
    step,
    title,
    addSet,
    openEditor,
    removeExercise,
    removeSet,
    reset,
    save,
    startEditor,
    startPicker,
    updateSet,
  }
}

function validateDraftSets(sets) {
  let completeSets = 0

  for (const set of sets) {
    const weightBlank = set.weight === '' || set.weight === null || set.weight === undefined
    const repsBlank = set.reps === '' || set.reps === null || set.reps === undefined

    if (weightBlank && repsBlank) continue
    if (weightBlank || repsBlank) return false

    const weight = Number(String(set.weight).replace(',', '.'))
    const reps = Number(set.reps)
    if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(reps) || reps <= 0) return false
    completeSets += 1
  }

  return completeSets > 0
}

function mapSets(sets) {
  return sets.map((set) => ({
    weight: set.weight ?? '',
    reps: set.reps ?? '',
  }))
}

function createEmptySets() {
  return Array.from({ length: 3 }, () => ({ weight: '', reps: '' }))
}

function exerciseFallback(exercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    categoryName: 'Exercise',
    categoryColor: null,
  }
}
