<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { parseFitNotesFile, warmUpSqliteEngine } from './fitnotes'
import {
  clearLocalData,
  deleteWorkoutExercise,
  getBodyTrackerData,
  getExerciseCatalog,
  getPreviousWorkoutSetsForExercise,
  getSummary,
  getWorkoutDateSet,
  getWorkoutSetsForDate,
  getWorkoutSetsForDateExercise,
  migrateLegacyLocalStorage,
  requestPersistentStorage,
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
let dayLoadSequence = 0

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

const fileLabel = computed(() => selectedFile.value?.name || 'No file selected')
const hasCurrentData = computed(() => data.value.isEmpty !== true)

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

const calendarMonths = computed(() => {
  const months = []
  const cursor = new Date(2022, 0, 1)
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  while (cursor <= end) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    months.push(buildCalendarMonth(year, month))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
})

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
})

watch(selectedDate, () => {
  void loadDayExercises()
})

watch(workoutModalOpen, (open) => {
  document.body.classList.toggle('modal-open', open)
})

function todayKey() {
  return dateToKey(new Date())
}

function createEmptySummary() {
  return {
    fileName: null,
    totalSets: 0,
    totalExercises: 0,
    firstWorkoutDate: null,
    lastWorkoutDate: null,
    backupStored: false,
    isEmpty: true,
  }
}

function dateToKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDateKey(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + amount)
  return dateToKey(date)
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function formatBodyNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}

function formatBodyValue(item) {
  if (item.value === null) return 'No data yet'
  const separator = item.unit === '%' ? '' : ' '
  return `${formatBodyNumber(item.value)}${separator}${item.unit}`
}

function formatBodyEntryDate(item) {
  if (!item.date) return ''
  const date = formatDate(item.date)
  if (!item.time) return date
  return `${date} at ${String(item.time).slice(0, 5)}`
}


function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

function buildCalendarMonth(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leadingBlankDays = (firstDay.getDay() + 6) % 7
  const days = []

  for (let index = 0; index < leadingBlankDays; index += 1) {
    days.push({ key: `blank-${year}-${monthIndex}-${index}`, blank: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    days.push({ key, blank: false, day })
  }

  return {
    key: monthKey(year, monthIndex),
    label: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(firstDay),
    days,
  }
}

function isToday(dateKey) {
  return dateKey === todayKey()
}

function hasWorkout(dateKey) {
  return calendarWorkoutDates.value.has(dateKey)
}

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

function openSettings() {
  activeView.value = 'settings'
  error.value = ''
  dataDeleteConfirming.value = false
  dataDeleteError.value = ''
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

function openWorkoutLog() {
  activeView.value = 'workouts'
  error.value = ''
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

function changeDay(amount) {
  selectedDate.value = shiftDateKey(selectedDate.value, amount)
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] ?? null
  error.value = ''
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
        sets: 0,
      })
    }
    exercises.get(set.exerciseId).sets += 1
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
  if (event.key === 'Escape' && workoutModalOpen.value) closeWorkoutModal()
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

function androidColorToCss(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '#7c7c85'
  const rgb = (Number(value) >>> 0) & 0xffffff
  if (rgb === 0x000000) return '#a1a1aa'
  return `#${rgb.toString(16).padStart(6, '0')}`
}

function exerciseMeta(exercise) {
  const workouts = `${exercise.workoutCount} ${exercise.workoutCount === 1 ? 'workout' : 'workouts'}`
  if (!exercise.lastWorkoutDate) return workouts
  return `${workouts} · ${relativeDate(exercise.lastWorkoutDate)}`
}

function relativeDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const [todayYear, todayMonth, todayDay] = todayKey().split('-').map(Number)
  const today = new Date(todayYear, todayMonth - 1, todayDay)
  const days = Math.round((today - target) / 86400000)

  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days > 1 && days < 30) return `${days} days ago`
  if (days >= 30 && days < 365) {
    const months = Math.max(1, Math.round(days / 30))
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  if (days >= 365) {
    const years = Math.max(1, Math.round(days / 365))
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  }
  return formatDate(dateKey)
}

function friendlyError(err) {
  const message = err instanceof Error ? err.message : String(err ?? '')

  if (message.includes('file is not a database') || message.includes('malformed')) {
    return 'The file does not contain a valid FitNotes SQLite database.'
  }

  if (message.toLowerCase().includes('quota')) {
    return 'The device does not have enough browser storage for this backup.'
  }

  return message || 'Something went wrong.'
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
            <h2>{{ selectedDateLabel }}</h2>
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
            <span class="exercise-row-copy">
              <strong>{{ exercise.name }}</strong>
            </span>
            <span class="exercise-row-meta">
              <span>{{ exercise.sets }} {{ exercise.sets === 1 ? 'set' : 'sets' }}</span>
              <span class="exercise-row-chevron" aria-hidden="true">›</span>
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

          <button v-if="!dayExercises.length" class="day-action day-copy-previous" type="button" disabled>
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
              <div class="body-measurement-copy">
                <h2>{{ item.name }}</h2>
                <p class="body-measurement-value">
                  <strong>{{ formatBodyValue(item) }}</strong>
                  <span v-if="item.change !== null" class="body-measurement-change">
                    {{ item.change < 0 ? '▼' : '▲' }} {{ formatBodyNumber(Math.abs(item.change)) }}
                  </span>
                </p>
                <small v-if="item.date">{{ formatBodyEntryDate(item) }}</small>
              </div>

              <svg class="body-measurement-heart" :class="{ 'is-favorite': item.favorite }" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>
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

      <section class="calendar-stack" aria-label="Workout calendar">
        <article
          v-for="month in calendarMonths"
          :id="month.key === currentMonthKey ? 'calendar-current-month' : undefined"
          :key="month.key"
          class="calendar-month"
        >
          <div class="calendar-month-heading">
            <h2>{{ month.label }}</h2>
            <span v-if="month.key === currentMonthKey">Current month</span>
          </div>

          <div class="calendar-weekdays" aria-hidden="true">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          <div class="calendar-grid">
            <template v-for="day in month.days" :key="day.key">
              <span v-if="day.blank" class="calendar-day is-blank" aria-hidden="true"></span>
              <button
                v-else
                class="calendar-day"
                :class="{
                  'is-selected': selectedDate === day.key,
                  'is-today': isToday(day.key),
                  'has-workout': hasWorkout(day.key),
                }"
                type="button"
                :aria-label="formatDate(day.key)"
                @click="selectCalendarDate(day.key)"
              >
                <span class="calendar-day-number">{{ day.day }}</span>
                <span v-if="hasWorkout(day.key)" class="calendar-workout-dot" aria-hidden="true"></span>
              </button>
            </template>
          </div>
        </article>
      </section>
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
          <button class="settings-export-button" type="button" disabled>Export .fitnotes</button>
        </div>

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

  <nav class="bottom-bar" aria-label="App navigation">
    <button class="bottom-item is-action" :class="{ 'is-active': activeView === 'body' }" type="button" aria-label="Body" @click="openBody">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5" r="2.25" />
        <path d="M8.5 10.2c.9-1.7 2-2.7 3.5-2.7s2.6 1 3.5 2.7M9 10.5l-1 4.5m7-4.5 1 4.5M10.4 13.5 10 21m3.6-7.5.4 7.5" />
      </svg>
      <span>Body</span>
    </button>

    <button class="bottom-item is-action" :class="{ 'is-active': activeView === 'calendar' }" type="button" aria-label="Calendar" @click="openCalendar">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
        <path d="M7.5 3.5v4m9-4v4M3.5 10h17" />
      </svg>
      <span>Calendar</span>
    </button>

    <button class="bottom-item is-action" :class="{ 'is-active': activeView === 'workouts' }" type="button" aria-label="Workout log" @click="openWorkoutLog">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="9.5" width="3" height="5" rx=".75" />
        <rect x="5.5" y="7.5" width="3" height="9" rx=".75" />
        <path d="M8.5 12h7" />
        <rect x="15.5" y="7.5" width="3" height="9" rx=".75" />
        <rect x="18.5" y="9.5" width="3" height="5" rx=".75" />
      </svg>
      <span>Log</span>
    </button>

    <button class="bottom-item" type="button" aria-label="Charts" disabled>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V10m5 10V4m6 16v-7m5 7V7" />
      </svg>
      <span>Charts</span>
    </button>

    <button class="bottom-item is-action" :class="{ 'is-active': activeView === 'settings' }" type="button" aria-label="Settings" @click="openSettings">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.16.38.5.72.91.88.2.08.41.12.63.12H21v4h-.09c-.66 0-1.26.4-1.51 1Z" />
      </svg>
      <span>Settings</span>
    </button>
  </nav>

  <Teleport to="body">
    <div v-if="workoutModalOpen" class="modal-layer" @click.self="closeWorkoutModal">
      <section class="workout-modal" role="dialog" aria-modal="true" :aria-label="modalStep === 'exercise' ? 'Choose exercise' : editorTitle">
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
      </section>
    </div>
  </Teleport>
</template>
