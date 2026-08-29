import { computed, ref } from 'vue'
import {
  createCategoryDetails,
  createExerciseDetails,
  getExerciseCatalog,
  updateCategoryDetails,
  updateExerciseDetails,
} from '../../../data/repositories/catalogRepository'
import { cssColorToAndroid } from '../../../shared/utils/colors'
import { friendlyError } from '../../../shared/utils/errors'

export function useCatalogManager(callbacks = {}) {
  const categories = ref([])
  const exercises = ref([])
  const error = ref('')
  const loading = ref(false)
  const mode = ref('muscles')
  const page = ref('list')
  const saving = ref(false)
  const searchQuery = ref('')
  const selectedItem = ref(null)
  const filteredItems = computed(readFilteredItems)
  const title = computed(readTitle)

  async function open(nextMode) {
    reset()
    mode.value = nextMode
    await load()
  }

  async function load() {
    loading.value = true
    error.value = ''

    try {
      const catalog = await getExerciseCatalog()
      categories.value = catalog.categories
      exercises.value = catalog.exercises
    } catch {
      error.value = 'Catalog could not be loaded.'
    } finally {
      loading.value = false
    }
  }

  function select(item) {
    selectedItem.value = item
    page.value = 'details'
    error.value = ''
  }

  function startCreate() {
    error.value = ''
    page.value = 'create'
    selectedItem.value = mode.value === 'muscles'
      ? { id: null, name: '', colour: cssColorToAndroid('#4b9cff') }
      : { id: null, name: '', categoryId: categories.value[0]?.id ?? null }
  }

  async function saveMuscle(details) {
    if (!selectedItem.value || saving.value) return
    saving.value = true
    error.value = ''

    try {
      const detailsToSave = {
        name: details.name,
        colour: cssColorToAndroid(details.colour),
      }
      if (page.value === 'create') {
        await createCategoryDetails(detailsToSave)
      } else {
        await updateCategoryDetails(selectedItem.value.id, detailsToSave)
      }
      await load()
      selectedItem.value = null
      page.value = 'list'
    } catch (saveError) {
      error.value = friendlyError(saveError)
    } finally {
      saving.value = false
    }
  }

  async function saveExercise(details) {
    if (!selectedItem.value || saving.value) return
    saving.value = true
    error.value = ''

    try {
      const result = page.value === 'create'
        ? await createExerciseDetails(details)
        : await updateExerciseDetails(selectedItem.value.id, details)
      callbacks.onChanged?.(result.summary)
      await load()
      selectedItem.value = null
      page.value = 'list'
    } catch (saveError) {
      error.value = friendlyError(saveError)
    } finally {
      saving.value = false
    }
  }

  function goBack() {
    if (page.value !== 'details' && page.value !== 'create') return false
    selectedItem.value = null
    page.value = 'list'
    error.value = ''
    return true
  }

  function reset() {
    categories.value = []
    exercises.value = []
    error.value = ''
    loading.value = false
    page.value = 'list'
    saving.value = false
    searchQuery.value = ''
    selectedItem.value = null
  }

  function readFilteredItems() {
    const source = mode.value === 'muscles' ? categories.value : exercises.value
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return source

    const matches = []
    for (const item of source) {
      if (String(item.name).toLowerCase().includes(query)) matches.push(item)
    }
    return matches
  }

  function readTitle() {
    if (page.value === 'create') return mode.value === 'muscles' ? 'Add muscle' : 'Add exercise'
    if (page.value === 'details') return mode.value === 'muscles' ? 'Edit muscle' : 'Edit exercise'
    return mode.value === 'muscles' ? 'Muscles' : 'Exercises'
  }

  return {
    categories,
    error,
    filteredItems,
    loading,
    mode,
    page,
    saving,
    searchQuery,
    selectedItem,
    title,
    goBack,
    open,
    reset,
    saveExercise,
    saveMuscle,
    select,
    startCreate,
  }
}
