<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppBottomNavigation from './app/AppBottomNavigation.vue'
import { createFitNotesExport, parseFitNotesFile, warmUpSqliteEngine } from './fitnotes'
import { formatBodyEntryDate, formatBodyValue } from './features/body/bodyFormatters'
import CalendarList from './features/calendar/components/CalendarList.vue'
import { createCalendarMonths, monthKey } from './features/calendar/calendarUtils'
import { exerciseMeta } from './features/workouts/exerciseFormatters'
import BaseModal from './shared/components/BaseModal.vue'
import { createEmptySummary } from './shared/models/summary'
import { androidColorToCss } from './shared/utils/colors'
import { formatDate, shiftDateKey, todayKey } from './shared/utils/dates'
import { friendlyError } from './shared/utils/errors'
import { formatNumber as formatBodyNumber } from './shared/utils/numbers'
import {
  clearLocalData,
  copyWorkoutDay,
  deleteWorkoutExercise,
  getBodyTrackerData,
  getExerciseCatalog,
  getFitNotesExportData,
  getPreviousWorkoutSetsForExercise,
  getSummary,
  getWorkoutDateSet,
  getWorkoutSetsForDate,
  getWorkoutSetsForDateExercise,
  migrateLegacyLocalStorage,
  requestPersistentStorage,
  saveBodyFavoriteIds,
  saveBodyMeasurementValue,
  saveFitNotesImport,
  saveWorkoutExercise,
} from './storage'

const selectedFile = ref(null)
const data = ref(createEmptySummary())
const dayExercises = ref([])
const error = ref('')
const loading = ref(false)
const selectedDate = ref(todayKey())
const activeView = ref('workouts')
const calendarWorkoutDates = ref(new Set())
const bodyFavorites = ref([])
const bodyMeasurements = ref([])
const bodyLoading = ref(false)
const bodyError = ref('')
const bodyFavoritesSaving = ref(false)
const copyDayModalOpen = ref(false)
const copyingDay = ref(false)
const copyDayError = ref('')
const bodyValueModalOpen = ref(false)
const selectedBodyItem = ref(null)
const bodyValue = ref('')
const bodyValueSaving = ref(false)
const bodyValueError = ref('')
const bodyValueInput = ref(null)
let dayLoadSequence = 0
let exportPreparationSequence = 0

const bodySections = computed(() => [
  { id: 'favorites', label: 'Favorites', items: bodyFavorites.value, emptyMessage: 'No favorites yet.' },
  { id: 'measurements', label: 'All Measurements', items: bodyMeasurements.value, emptyMessage: 'No other measurements yet.' },
])

const workoutModalOpen = ref(false)
const modalStep = ref('exercise')
const modalLoading = ref(false)
const editorSaving = ref(false)
const editorError = ref('')
const searchQuery = ref('')
const selectedCategoryId = ref(null)
const exerciseCatalog = ref([])
const categories = ref([])
const selectedExercise = ref(null)
const draftSets = ref([])
const previousSets = ref([])
const editorHasExistingSets = ref(false)
const deleteConfirming = ref(false)
const dataDeleteConfirming = ref(false)
const deletingData = ref(false)
const dataDeleteError = ref('')
const exportingData = ref(false)
const exportError = ref('')
const exportUrl = ref('')
const exportFileName = ref('')

const fileLabel = computed(() => selectedFile.value?.name || 'No file selected')
const hasCurrentData = computed(() => data.value.isEmpty !== true)
const canSaveBodyValue = computed(() => {
  const text = String(bodyValue.value).trim()
  if (!text) return false
  const value = Number(text.replace(',', '.'))
  return Number.isFinite(value) && value >= 0
})

const selectedDateLabel = computed(() => {
  const today = todayKey()
  const yesterday = shiftDateKey(today, -1)
  const tomorrow = shiftDateKey(today, 1)

  if (selectedDate.value === today) return 'Today'
  if (selectedDate.value === yesterday) return 'Yesterday'
  if (selectedDate.value === tomorrow) return 'Tomorrow'

  return formatDate(selectedDate.value)
})

const selectedDateLong = computed(() => formatDate(selectedDate.value))


const currentMonthKey = computed(() => {
  const now = new Date()
  return monthKey(now.getFullYear(), now.getMonth())
})

const calendarMonths = computed(() => createCalendarMonths(calendarWorkoutDates.value))
const copyCalendarMonths = computed(() => createCalendarMonths(calendarWorkoutDates.value))

const filteredExercises = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return exerciseCatalog.value.filter((exercise) => {
    const matchesCategory = selectedCategoryId.value === null || exercise.categoryId === selectedCategoryId.value
    const matchesSearch = !query || exercise.name.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })
})

const editorTitle = computed(() => editorHasExistingSets.value ? 'Edit exercise' : 'Log exercise')

const canSaveExercise = computed(() => {
  let completeSets = 0

  for (const set of draftSets.value) {
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
})

onMounted(async () => {
  try {
    await migrateLegacyLocalStorage()
    data.value = await getSummary() ?? createEmptySummary()
    await loadDayExercises()
  } catch {
    error.value = 'Local workout data could not be opened.'
  }

  void requestPersistentStorage()
  void warmUpSqliteEngine().catch(() => {})
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
  window.removeEventListener('keydown', onKeyDown)
  clearFitNotesExport()
})

watch(selectedDate, () => {
  void loadDayExercises()
})

watch(() => workoutModalOpen.value || copyDayModalOpen.value || bodyValueModalOpen.value, (open) => {
  document.body.classList.toggle('modal-open', open)
})

async function openBody() {
  activeView.value = 'body'
  bodyLoading.value = true
  bodyError.value = ''

  try {
    const bodyData = await getBodyTrackerData()
    bodyFavorites.value = bodyData.favorites
    bodyMeasurements.value = bodyData.measurements
  } catch {
    bodyError.value = 'Body data could not be loaded from local storage.'
  } finally {
    bodyLoading.value = false
  }

  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

async function toggleBodyFavorite(item) {
  if (bodyFavoritesSaving.value) return

  bodyFavoritesSaving.value = true
  bodyError.value = ''

  try {
    const favoriteIds = bodyFavorites.value.map((favorite) => favorite.id)
    const nextFavoriteIds = item.favorite
      ? favoriteIds.filter((id) => id !== item.id)
      : [...favoriteIds, item.id]

    await saveBodyFavoriteIds(nextFavoriteIds)
    const bodyData = await getBodyTrackerData()
    bodyFavorites.value = bodyData.favorites
    bodyMeasurements.value = bodyData.measurements
  } catch {
    bodyError.value = 'Favorites could not be updated in local storage.'
  } finally {
    bodyFavoritesSaving.value = false
  }
}

async function openBodyValueModal(item) {
  selectedBodyItem.value = item
  bodyValue.value = ''
  bodyValueError.value = ''
  bodyValueModalOpen.value = true
  await nextTick()
  bodyValueInput.value?.focus()
}

function closeBodyValueModal(force = false) {
  if (bodyValueSaving.value && !force) return
  bodyValueModalOpen.value = false
  selectedBodyItem.value = null
  bodyValue.value = ''
  bodyValueError.value = ''
}

async function saveBodyValue() {
  if (!selectedBodyItem.value || !canSaveBodyValue.value || bodyValueSaving.value) return

  bodyValueSaving.value = true
  bodyValueError.value = ''
  bodyError.value = ''

  try {
    const bodyData = await saveBodyMeasurementValue(selectedBodyItem.value, bodyValue.value)
    bodyFavorites.value = bodyData.favorites
    bodyMeasurements.value = bodyData.measurements
    closeBodyValueModal(true)
  } catch (err) {
    bodyValueError.value = friendlyError(err)
  } finally {
    bodyValueSaving.value = false
  }
}

async function openCalendar() {
  activeView.value = 'calendar'
  calendarWorkoutDates.value = await getWorkoutDateSet()

  await nextTick()
  const currentMonth = document.getElementById('calendar-current-month')
  if (!currentMonth) return

  const top = currentMonth.getBoundingClientRect().top + window.scrollY - 20
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
}

function selectCalendarDate(dateKey) {
  selectedDate.value = dateKey
  activeView.value = 'workouts'
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

async function openCopyDayModal() {
  copyDayModalOpen.value = true
  copyDayError.value = ''

  try {
    calendarWorkoutDates.value = await getWorkoutDateSet()
  } catch {
    copyDayError.value = 'Workout dates could not be loaded.'
  }

  await nextTick()
  document.getElementById('copy-calendar-current-month')?.scrollIntoView({ block: 'start' })
}

function closeCopyDayModal(force = false) {
  if (copyingDay.value && !force) return
  copyDayModalOpen.value = false
  copyDayError.value = ''
}

async function copyWorkoutDate(sourceDate) {
  if (copyingDay.value) return
  copyingDay.value = true
  copyDayError.value = ''

  try {
    data.value = await copyWorkoutDay(sourceDate, selectedDate.value) ?? createEmptySummary()
    const [, , workoutDates] = await Promise.all([loadDayExercises(), loadExerciseCatalog(), getWorkoutDateSet()])
    calendarWorkoutDates.value = workoutDates
    closeCopyDayModal(true)
  } catch (err) {
    copyDayError.value = friendlyError(err)
  } finally {
    copyingDay.value = false
  }
}

function openSettings() {
  activeView.value = 'settings'
  error.value = ''
  exportError.value = ''
  dataDeleteConfirming.value = false
  dataDeleteError.value = ''
  void prepareFitNotesExport()
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

async function prepareFitNotesExport() {
  clearFitNotesExport()
  const sequence = exportPreparationSequence
  if (!data.value.backupStored) return

  exportingData.value = true
  exportError.value = ''

  try {
    const source = await getFitNotesExportData()
    if (!source) throw new Error('The original FitNotes backup is not available on this device.')

    const bytes = await createFitNotesExport(source.bytes, source.workoutSets)
    if (sequence !== exportPreparationSequence) return

    exportFileName.value = createExportFileName()
    exportUrl.value = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.sqlite3' }))
  } catch (err) {
    if (sequence === exportPreparationSequence) exportError.value = friendlyError(err)
  } finally {
    if (sequence === exportPreparationSequence) exportingData.value = false
  }
}

function clearFitNotesExport() {
  exportPreparationSequence += 1
  if (exportUrl.value) URL.revokeObjectURL(exportUrl.value)
  exportUrl.value = ''
  exportFileName.value = ''
  exportingData.value = false
}

function createExportFileName() {
  const now = new Date()
  const parts = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ].map((part) => String(part).padStart(2, '0'))

  return `FitNotes_Backup_${parts.join('_')}.fitnotes`
}

function openWorkoutLog() {
  activeView.value = 'workouts'
  error.value = ''
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

function navigateTo(view) {
  if (view === 'body') return openBody()
  if (view === 'calendar') return openCalendar()
  if (view === 'settings') return openSettings()
  return openWorkoutLog()
}

function changeDay(amount) {
  selectedDate.value = shiftDateKey(selectedDate.value, amount)
}

function goToToday() {
  selectedDate.value = todayKey()
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] ?? null
  error.value = ''
  exportError.value = ''
  dataDeleteConfirming.value = false
  dataDeleteError.value = ''
}

async function loadDayExercises() {
  const sequence = ++dayLoadSequence
  const sets = await getWorkoutSetsForDate(selectedDate.value)
  if (sequence !== dayLoadSequence) return

  const exercises = new Map()
  for (const set of sets) {
    if (!exercises.has(set.exerciseId)) {
      exercises.set(set.exerciseId, {
        id: set.exerciseId,
        name: set.exerciseName,
        sets: [],
      })
    }
    exercises.get(set.exerciseId).sets.push({
      id: set.id,
      weight: set.weight,
      reps: set.reps,
    })
  }

  dayExercises.value = [...exercises.values()]
}

async function analyzeFile() {
  if (!selectedFile.value) {
    error.value = 'Select a .fitnotes file first.'
    return
  }

  loading.value = true
  error.value = ''
  dataDeleteConfirming.value = false
  dataDeleteError.value = ''

  try {
    void requestPersistentStorage()

    const { parsed, bytes } = await parseFitNotesFile(selectedFile.value)
    await saveFitNotesImport(parsed, selectedFile.value, bytes)

    data.value = parsed.summary
    selectedDate.value = todayKey()
    calendarWorkoutDates.value = await getWorkoutDateSet()
    await loadDayExercises()
    if (activeView.value === 'settings') await prepareFitNotesExport()
  } catch (err) {
    error.value = friendlyError(err)
  } finally {
    loading.value = false
  }
}

async function openWorkoutModal() {
  workoutModalOpen.value = true
  modalStep.value = 'exercise'
  editorError.value = ''
  searchQuery.value = ''
  selectedCategoryId.value = null
  selectedExercise.value = null
  deleteConfirming.value = false

  await loadExerciseCatalog()
}

async function loadExerciseCatalog() {
  modalLoading.value = true
  try {
    const catalog = await getExerciseCatalog()
    exerciseCatalog.value = catalog.exercises
    categories.value = catalog.categories
  } catch {
    editorError.value = 'Exercises could not be loaded from local storage.'
  } finally {
    modalLoading.value = false
  }
}

async function chooseExercise(exercise) {
  await openExerciseEditor(exercise)
}

async function editDayExercise(dayExercise) {
  workoutModalOpen.value = true
  editorError.value = ''

  try {
    if (!exerciseCatalog.value.length) {
      const catalog = await getExerciseCatalog()
      exerciseCatalog.value = catalog.exercises
      categories.value = catalog.categories
    }

    const fullExercise = exerciseCatalog.value.find((exercise) => exercise.id === dayExercise.id) ?? {
      id: dayExercise.id,
      name: dayExercise.name,
      categoryName: 'Exercise',
      categoryColor: null,
    }

    await openExerciseEditor(fullExercise)
  } catch {
    await openExerciseEditor({
      id: dayExercise.id,
      name: dayExercise.name,
      categoryName: 'Exercise',
      categoryColor: null,
    })
  }
}

async function openExerciseEditor(exercise) {
  selectedExercise.value = exercise
  modalStep.value = 'sets'
  editorLoadingReset()

  try {
    const [currentSets, previous] = await Promise.all([
      getWorkoutSetsForDateExercise(selectedDate.value, exercise.id),
      getPreviousWorkoutSetsForExercise(exercise.id, selectedDate.value),
    ])

    editorHasExistingSets.value = currentSets.length > 0
    previousSets.value = previous.sets

    if (currentSets.length) {
      draftSets.value = currentSets.map((set) => ({
        weight: set.weight ?? '',
        reps: set.reps ?? '',
      }))
      return
    }

    if (previous.sets.length) {
      draftSets.value = previous.sets.map((set) => ({
        weight: set.weight ?? '',
        reps: set.reps ?? '',
      }))
      return
    }

    draftSets.value = Array.from({ length: 3 }, () => ({ weight: '', reps: '' }))
  } catch {
    editorError.value = 'Workout history for this exercise could not be loaded.'
    draftSets.value = Array.from({ length: 3 }, () => ({ weight: '', reps: '' }))
  }
}

function editorLoadingReset() {
  editorError.value = ''
  editorHasExistingSets.value = false
  deleteConfirming.value = false
  draftSets.value = []
  previousSets.value = []
}

function closeWorkoutModal(force = false) {
  if (editorSaving.value && !force) return
  workoutModalOpen.value = false
  modalStep.value = 'exercise'
  selectedExercise.value = null
  editorLoadingReset()
}

function onKeyDown(event) {
  if (event.key !== 'Escape') return
  if (workoutModalOpen.value) closeWorkoutModal()
  else if (copyDayModalOpen.value) closeCopyDayModal()
  else if (bodyValueModalOpen.value) closeBodyValueModal()
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


async function deleteExerciseFromDay() {
  if (!selectedExercise.value || !editorHasExistingSets.value) return

  if (!deleteConfirming.value) {
    deleteConfirming.value = true
    return
  }

  editorSaving.value = true
  editorError.value = ''

  try {
    data.value = await deleteWorkoutExercise(selectedDate.value, selectedExercise.value.id)
    const [, , workoutDates] = await Promise.all([loadDayExercises(), loadExerciseCatalog(), getWorkoutDateSet()])
    calendarWorkoutDates.value = workoutDates
    closeWorkoutModal(true)
  } catch (err) {
    editorError.value = friendlyError(err)
  } finally {
    editorSaving.value = false
  }
}

async function saveExercise() {
  if (!selectedExercise.value || !canSaveExercise.value) return

  editorSaving.value = true
  editorError.value = ''

  try {
    data.value = await saveWorkoutExercise(selectedDate.value, selectedExercise.value, draftSets.value)
    const [, , workoutDates] = await Promise.all([loadDayExercises(), loadExerciseCatalog(), getWorkoutDateSet()])
    calendarWorkoutDates.value = workoutDates
    closeWorkoutModal(true)
  } catch (err) {
    editorError.value = friendlyError(err)
  } finally {
    editorSaving.value = false
  }
}

function categoryStyle(category) {
  return { '--category-color': androidColorToCss(category?.colour) }
}

function exerciseStyle(exercise) {
  return { '--category-color': androidColorToCss(exercise?.categoryColor) }
}

async function deleteCurrentData() {
  if (!hasCurrentData.value || deletingData.value) return

  if (!dataDeleteConfirming.value) {
    dataDeleteConfirming.value = true
    return
  }

  deletingData.value = true
  dataDeleteError.value = ''

  try {
    await clearLocalData()
    dayLoadSequence += 1
    data.value = createEmptySummary()
    dayExercises.value = []
    calendarWorkoutDates.value = new Set()
    bodyFavorites.value = []
    bodyMeasurements.value = []
    exerciseCatalog.value = []
    categories.value = []
    selectedExercise.value = null
    previousSets.value = []
    editorHasExistingSets.value = false
    selectedDate.value = todayKey()
    dataDeleteConfirming.value = false
    exportError.value = ''
    clearFitNotesExport()
  } catch (err) {
    dataDeleteError.value = friendlyError(err)
  } finally {
    deletingData.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <template v-if="activeView === 'workouts'">
      <section class="day-card home-day-card">
        <div class="day-navigation">
          <button class="nav-button" aria-label="Previous day" @click="changeDay(-1)">←</button>

          <div class="day-title">
            <h2 @click="goToToday">{{ selectedDateLabel }}</h2>
          </div>

          <button class="nav-button" aria-label="Next day" @click="changeDay(1)">→</button>
        </div>

        <div v-if="dayExercises.length" class="exercise-list">
          <button
            v-for="exercise in dayExercises"
            :key="exercise.id"
            class="exercise-row"
            type="button"
            :aria-label="`Edit ${exercise.name}`"
            @click="editDayExercise(exercise)"
          >
            <span class="exercise-row-heading">
              <strong>{{ exercise.name }}</strong>
              <span class="exercise-row-chevron" aria-hidden="true">›</span>
            </span>
            <span class="exercise-set-list">
              <span v-for="(set, index) in exercise.sets" :key="set.id" class="exercise-set-row">
                <span class="exercise-set-number">{{ index + 1 }}</span>
                <span class="exercise-set-weight">{{ formatBodyNumber(set.weight) }} kg</span>
                <span class="exercise-set-reps">{{ set.reps }} reps</span>
              </span>
            </span>
          </button>
        </div>

        <div class="day-actions" :class="{ 'is-empty': !dayExercises.length }">
          <button class="day-action day-add-exercise" type="button" @click="openWorkoutModal">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add Exercise</span>
          </button>

          <button v-if="!dayExercises.length" class="day-action day-copy-previous" type="button" @click="openCopyDayModal">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path d="M16 8V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1" />
            </svg>
            <span>Copy Previous Day</span>
          </button>
        </div>
      </section>
    </template>

    <template v-else-if="activeView === 'body'">
      <header class="app-header body-header">
        <div>
          <p class="eyebrow">BODY</p>
          <h1>Body Tracker</h1>
        </div>
      </header>

      <div v-if="bodyLoading" class="body-status">Loading body data…</div>
      <p v-else-if="bodyError" class="body-error">{{ bodyError }}</p>

      <div v-else class="body-sections">
        <section v-for="section in bodySections" :key="section.id" class="body-section-card">
          <p class="body-section-label">{{ section.label }}</p>

          <p v-if="!section.items.length" class="body-status">{{ section.emptyMessage }}</p>

          <div v-else class="body-measurement-list">
            <article v-for="item in section.items" :key="item.id" class="body-measurement-row">
              <button class="body-measurement-copy" type="button" :aria-label="`Add a new ${item.name} value`" @click="openBodyValueModal(item)">
                <span class="body-measurement-name">{{ item.name }}</span>
                <span class="body-measurement-value">
                  <strong>{{ formatBodyValue(item) }}</strong>
                  <span v-if="item.change !== null" class="body-measurement-change">
                    {{ item.change < 0 ? '▼' : '▲' }} {{ formatBodyNumber(Math.abs(item.change)) }}
                  </span>
                </span>
                <small v-if="item.date">{{ formatBodyEntryDate(item) }}</small>
              </button>

              <button
                class="body-favorite-button"
                type="button"
                :aria-label="item.favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`"
                :aria-pressed="item.favorite"
                :disabled="bodyFavoritesSaving"
                @click.stop="toggleBodyFavorite(item)"
              >
                <svg class="body-measurement-heart" :class="{ 'is-favorite': item.favorite }" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                </svg>
              </button>
            </article>
          </div>
        </section>
      </div>
    </template>

    <template v-else-if="activeView === 'calendar'">
      <header class="app-header calendar-header">
        <div>
          <p class="eyebrow">FITNOTES VIEWER</p>
          <h1>Calendar</h1>
        </div>
        <span class="data-pill">{{ selectedDateLong }}</span>
      </header>

      <section class="calendar-intro">
        <p>Choose a day to open it. Scroll up for previous months.</p>
      </section>

      <CalendarList
        :months="calendarMonths"
        :current-month-key="currentMonthKey"
        current-month-element-id="calendar-current-month"
        :selected-date="selectedDate"
        :workout-dates="calendarWorkoutDates"
        aria-label="Workout calendar"
        @select="selectCalendarDate"
      />
    </template>

    <template v-else-if="activeView === 'settings'">
      <section class="settings-card">
        <div class="settings-section-heading">
          <div>
            <p class="eyebrow">DATA</p>
            <h2>FitNotes backup</h2>
          </div>
        </div>

        <section class="upload-card settings-upload-card">
          <label class="file-picker">
            <input type="file" accept=".fitnotes" @change="onFileChange" />
            <span>Choose .fitnotes</span>
          </label>

          <p class="file-name">{{ fileLabel }}</p>

          <button class="primary-button" :disabled="loading || !selectedFile" @click="analyzeFile">
            {{ loading ? 'Importing…' : hasCurrentData ? 'Replace data' : 'Import' }}
          </button>

          <p v-if="error" class="error-message">{{ error }}</p>
        </section>

        <div v-if="hasCurrentData" class="settings-data-action">
          <div>
            <strong>Export current data</strong>
            <p>Download the current workout data as a FitNotes backup.</p>
          </div>
          <a
            v-if="exportUrl"
            class="settings-export-button"
            :href="exportUrl"
            :download="exportFileName"
          >
            Export .fitnotes
          </a>
          <button v-else class="settings-export-button" type="button" disabled>
            {{ exportingData ? 'Preparing…' : 'Export unavailable' }}
          </button>
        </div>

        <p v-if="exportError" class="settings-export-error">{{ exportError }}</p>

        <div v-if="hasCurrentData" class="settings-data-action">
          <div>
            <strong>Delete current data</strong>
            <p>Remove the imported backup and all workout data stored on this device.</p>
          </div>
          <button
            class="settings-delete-button"
            :class="{ 'is-confirming': dataDeleteConfirming }"
            type="button"
            :disabled="deletingData"
            @click="deleteCurrentData"
          >
            {{ deletingData ? 'Deleting…' : dataDeleteConfirming ? 'Tap again to delete' : 'Delete data' }}
          </button>
        </div>

        <p v-if="dataDeleteError" class="settings-delete-error">{{ dataDeleteError }}</p>
      </section>
    </template>
  </main>

  <AppBottomNavigation :active-view="activeView" @navigate="navigateTo" />

  <BaseModal
    :open="workoutModalOpen"
    :aria-label="modalStep === 'exercise' ? 'Choose exercise' : editorTitle"
    @close="closeWorkoutModal"
  >
        <template v-if="modalStep === 'exercise'">
          <header class="modal-header">
            <button class="modal-icon-button" type="button" aria-label="Close" @click="closeWorkoutModal">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
            </button>
            <div class="modal-heading">
              <p>{{ selectedDateLong }}</p>
              <h2>Choose exercise</h2>
            </div>
            <span class="modal-header-spacer" aria-hidden="true"></span>
          </header>

          <div class="exercise-picker-controls">
              <label class="search-field">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <input v-model="searchQuery" type="search" placeholder="Search exercises" autocomplete="off" />
              </label>

              <div class="category-strip" aria-label="Exercise categories">
                <button
                  class="category-chip"
                  :class="{ 'is-selected': selectedCategoryId === null }"
                  type="button"
                  @click="selectedCategoryId = null"
                >
                  All
                </button>
                <button
                  v-for="category in categories"
                  :key="category.id"
                  class="category-chip"
                  :class="{ 'is-selected': selectedCategoryId === category.id }"
                  :style="categoryStyle(category)"
                  type="button"
                  @click="selectedCategoryId = selectedCategoryId === category.id ? null : category.id"
                >
                  <span class="category-dot"></span>
                  {{ category.name }}
                </button>
              </div>
          </div>

          <div v-if="modalLoading" class="modal-list-status">Loading exercises…</div>
          <div v-else-if="!filteredExercises.length" class="modal-list-status">No exercises available yet.</div>

          <div v-else class="exercise-picker-list">
            <button
              v-for="exercise in filteredExercises"
              :key="exercise.id"
              class="exercise-picker-row"
              :style="exerciseStyle(exercise)"
              type="button"
              @click="chooseExercise(exercise)"
            >
              <span class="exercise-color-dot"></span>
              <span class="exercise-picker-copy">
                <strong>{{ exercise.name }}</strong>
                <small>{{ exercise.categoryName }} · {{ exerciseMeta(exercise) }}</small>
              </span>
              <span class="exercise-chevron">›</span>
            </button>
          </div>
        </template>

        <template v-else>
          <header class="modal-header">
            <button class="modal-icon-button" type="button" aria-label="Close" @click="closeWorkoutModal">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
            </button>
            <div class="modal-heading">
              <p>{{ selectedDateLong }}</p>
              <h2>{{ editorTitle }}</h2>
            </div>
            <span class="modal-header-spacer" aria-hidden="true"></span>
          </header>

          <div v-if="selectedExercise" class="set-editor">
            <div class="selected-exercise-card" :style="exerciseStyle(selectedExercise)">
              <span class="exercise-color-dot"></span>
              <div>
                <strong>{{ selectedExercise.name }}</strong>
                <small>{{ selectedExercise.categoryName }}</small>
              </div>
            </div>

            <div class="sets-grid sets-grid-header" aria-hidden="true">
              <span>Set</span>
              <span>kg</span>
              <span>Reps</span>
              <span></span>
            </div>

            <div class="sets-editor-list">
              <div v-for="(set, index) in draftSets" :key="index" class="sets-grid set-input-row">
                <span class="set-number">{{ index + 1 }}</span>
                <input v-model="set.weight" class="set-input" type="text" inputmode="decimal" placeholder="0" aria-label="Weight in kilograms" @input="deleteConfirming = false" />
                <input v-model="set.reps" class="set-input" type="number" inputmode="numeric" min="1" step="1" placeholder="0" aria-label="Repetitions" @input="deleteConfirming = false" />
                <button class="remove-set-button" type="button" aria-label="Remove set" @click="removeSet(index)">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m7 7 10 10M17 7 7 17" />
                  </svg>
                </button>
              </div>
            </div>

            <button class="add-set-button" type="button" @click="addSet">
              <span>+</span>
              Add set
            </button>

            <p v-if="editorError" class="editor-error">{{ editorError }}</p>

            <div class="editor-actions">
              <button
                v-if="editorHasExistingSets"
                class="delete-exercise-button"
                :class="{ 'is-confirming': deleteConfirming }"
                type="button"
                :disabled="editorSaving"
                @click="deleteExerciseFromDay"
              >
                {{ deleteConfirming ? 'Tap again to delete' : 'Delete exercise' }}
              </button>

              <button class="save-workout-button" type="button" :disabled="editorSaving || !canSaveExercise" @click="saveExercise">
                {{ editorSaving ? 'Saving…' : editorHasExistingSets ? 'Save changes' : 'Save exercise' }}
              </button>
            </div>
          </div>
        </template>
  </BaseModal>

  <BaseModal
    :open="copyDayModalOpen"
    aria-label="Copy workout from another day"
    modal-class="copy-calendar-modal"
    @close="closeCopyDayModal"
  >
        <header class="modal-header">
          <button class="modal-icon-button" type="button" aria-label="Close" @click="closeCopyDayModal">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
          <div class="modal-heading">
            <p>Copy to {{ selectedDateLong }}</p>
            <h2>Choose a day</h2>
          </div>
          <span class="modal-header-spacer" aria-hidden="true"></span>
        </header>

        <div class="copy-calendar-content">
          <p class="copy-calendar-intro">Choose any day. Empty days will copy an empty log.</p>

          <CalendarList
            :months="copyCalendarMonths"
            :current-month-key="currentMonthKey"
            current-month-element-id="copy-calendar-current-month"
            :workout-dates="calendarWorkoutDates"
            action-label-prefix="Copy"
            :disabled="copyingDay"
            compact
            aria-label="Choose a workout day to copy"
            @select="copyWorkoutDate"
          />

          <p v-if="copyDayError" class="editor-error copy-calendar-error">{{ copyDayError }}</p>
        </div>
  </BaseModal>

  <BaseModal
    :open="bodyValueModalOpen"
    :aria-label="`Add ${selectedBodyItem?.name ?? 'measurement'} value`"
    layer-class="body-value-layer"
    modal-class="body-value-modal"
    @close="closeBodyValueModal"
  >
        <header class="modal-header">
          <button class="modal-icon-button" type="button" aria-label="Close" @click="closeBodyValueModal">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" />
            </svg>
          </button>
          <div class="modal-heading">
            <p>New value</p>
            <h2>{{ selectedBodyItem?.name }}</h2>
          </div>
          <span class="modal-header-spacer" aria-hidden="true"></span>
        </header>

        <form class="body-value-form" @submit.prevent="saveBodyValue">
          <label for="body-value-input">Value</label>
          <div class="body-value-field">
            <input
              id="body-value-input"
              ref="bodyValueInput"
              v-model="bodyValue"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="0"
            />
            <span v-if="selectedBodyItem?.unit">{{ selectedBodyItem.unit }}</span>
          </div>

          <p v-if="bodyValueError" class="editor-error body-value-error">{{ bodyValueError }}</p>

          <button class="body-value-save" type="submit" :disabled="bodyValueSaving || !canSaveBodyValue">
            {{ bodyValueSaving ? 'Saving…' : 'Save value' }}
          </button>
        </form>
  </BaseModal>
</template>
