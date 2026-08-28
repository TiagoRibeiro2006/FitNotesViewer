<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { parseFitNotesFile, warmUpSqliteEngine } from './fitnotes'
import {
  deleteWorkoutExercise,
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
const data = ref(null)
const dayExercises = ref([])
const error = ref('')
const loading = ref(false)
const selectedDate = ref(todayKey())
const activeView = ref('workouts')
const calendarWorkoutDates = ref(new Set())
let dayLoadSequence = 0

const startModalOpen = ref(false)
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
const previousDate = ref(null)
const editorOrigin = ref('picker')
const editorHasExistingSets = ref(false)
const deleteConfirming = ref(false)

const fileLabel = computed(() => selectedFile.value?.name || 'No file selected')

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

const draftStats = computed(() => {
  let sets = 0
  let reps = 0
  let volume = 0

  for (const set of draftSets.value) {
    const weight = Number(String(set.weight ?? '').replace(',', '.'))
    const repetitionCount = Number(set.reps)
    if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(repetitionCount) || repetitionCount <= 0) continue

    sets += 1
    reps += repetitionCount
    volume += weight * repetitionCount
  }

  return { sets, reps, volume }
})

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
    data.value = await getSummary()
    if (data.value) await loadDayExercises()
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
  if (data.value) void loadDayExercises()
})

watch(startModalOpen, (open) => {
  document.body.classList.toggle('modal-open', open)
})

function todayKey() {
  return dateToKey(new Date())
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

async function openCalendar() {
  activeView.value = 'calendar'

  if (data.value) {
    calendarWorkoutDates.value = await getWorkoutDateSet()
  }

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
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

function backToWorkouts() {
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

async function openStartModal() {
  startModalOpen.value = true
  modalStep.value = 'exercise'
  editorError.value = ''
  searchQuery.value = ''
  selectedCategoryId.value = null
  selectedExercise.value = null
  editorOrigin.value = 'picker'
  deleteConfirming.value = false

  if (!data.value) return
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
  editorOrigin.value = 'picker'
  await openExerciseEditor(exercise)
}

async function editDayExercise(dayExercise) {
  startModalOpen.value = true
  editorOrigin.value = 'day'
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
    previousDate.value = previous.date

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
  previousDate.value = null
}

function handleEditorBack() {
  if (editorOrigin.value === 'day') {
    closeStartModal()
    return
  }

  backToExercisePicker()
}

function backToExercisePicker() {
  modalStep.value = 'exercise'
  selectedExercise.value = null
  editorOrigin.value = 'picker'
  editorLoadingReset()
}

function closeStartModal(force = false) {
  if (editorSaving.value && !force) return
  startModalOpen.value = false
  modalStep.value = 'exercise'
  selectedExercise.value = null
  editorOrigin.value = 'picker'
  editorLoadingReset()
}

function onKeyDown(event) {
  if (event.key === 'Escape' && startModalOpen.value) closeStartModal()
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
    closeStartModal(true)
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
    closeStartModal(true)
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

function previousSetLabel(index) {
  const set = previousSets.value[index]
  if (!set) return '—'
  return `${formatNumber(set.weight)} × ${set.reps}`
}

function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return Number.isInteger(number) ? String(number) : String(number).replace(/\.0+$/, '')
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
</script>

<template>
  <main class="page-shell">
    <template v-if="activeView === 'workouts'">
      <section v-if="!data" class="upload-card home-upload-card">
        <label class="file-picker">
          <input type="file" accept=".fitnotes" @change="onFileChange" />
          <span>Choose .fitnotes</span>
        </label>

        <p class="file-name">{{ fileLabel }}</p>

        <button class="primary-button" :disabled="loading || !selectedFile" @click="analyzeFile">
          {{ loading ? 'Importing…' : 'Import' }}
        </button>

        <p v-if="error" class="error-message">{{ error }}</p>
      </section>

      <section v-if="data" class="day-card home-day-card">
        <div class="day-navigation">
          <button class="nav-button" aria-label="Previous day" @click="changeDay(-1)">←</button>

          <div class="day-title">
            <h2>{{ selectedDateLabel }}</h2>
            <p>{{ selectedDateLong }}</p>
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
              <small>Tap to edit sets</small>
            </span>
            <span class="exercise-row-meta">
              <span>{{ exercise.sets }} {{ exercise.sets === 1 ? 'set' : 'sets' }}</span>
              <span class="exercise-row-chevron" aria-hidden="true">›</span>
            </span>
          </button>
        </div>

        <div v-else class="empty-day">
          <p>No workout on this day.</p>
        </div>
      </section>
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
      <header class="settings-header">
        <button class="settings-back-button" type="button" aria-label="Back to workouts" @click="backToWorkouts">←</button>
        <h1>Settings</h1>
        <span class="settings-header-spacer" aria-hidden="true"></span>
      </header>

      <section class="settings-card">
        <div class="settings-section-heading">
          <div>
            <p class="eyebrow">DATA</p>
            <h2>FitNotes backup</h2>
          </div>
          <span v-if="data" class="data-pill">{{ data.totalSets }} sets</span>
        </div>

        <section class="upload-card settings-upload-card">
          <label class="file-picker">
            <input type="file" accept=".fitnotes" @change="onFileChange" />
            <span>Choose .fitnotes</span>
          </label>

          <p class="file-name">{{ fileLabel }}</p>

          <button class="primary-button" :disabled="loading || !selectedFile" @click="analyzeFile">
            {{ loading ? 'Importing…' : data ? 'Replace data' : 'Import' }}
          </button>

          <p v-if="error" class="error-message">{{ error }}</p>
        </section>

        <div v-if="data" class="settings-data-meta">
          <span>{{ data.totalExercises }} exercises</span>
          <span aria-hidden="true">•</span>
          <span>{{ data.firstWorkoutDate }} → {{ data.lastWorkoutDate }}</span>
        </div>
      </section>
    </template>
  </main>

  <nav class="bottom-bar" aria-label="App navigation">
    <button class="bottom-item" type="button" aria-label="Body">
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

    <button class="bottom-item is-start-trigger" type="button" aria-label="Start" aria-haspopup="dialog" @click="openStartModal">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 2.65 5.37 5.93.86-4.29 4.18 1.01 5.91L12 16.53 6.7 19.32l1.01-5.91-4.29-4.18 5.93-.86L12 3Z" />
      </svg>
      <span>Start</span>
    </button>

    <button class="bottom-item" type="button" aria-label="Charts">
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
    <div v-if="startModalOpen" class="modal-layer" @click.self="closeStartModal">
      <section class="workout-modal" role="dialog" aria-modal="true" :aria-label="modalStep === 'exercise' ? 'Choose exercise' : editorTitle">
        <template v-if="modalStep === 'exercise'">
          <header class="modal-header">
            <button class="modal-icon-button" type="button" aria-label="Close" @click="closeStartModal">×</button>
            <div class="modal-heading">
              <p>{{ selectedDateLong }}</p>
              <h2>Choose exercise</h2>
            </div>
            <span class="modal-header-spacer" aria-hidden="true"></span>
          </header>

          <div v-if="!data" class="modal-empty-state">
            <div class="modal-empty-icon">+</div>
            <h3>Import your backup first</h3>
            <p>Your exercise library comes from the FitNotes backup stored on this device.</p>
            <button class="secondary-button" type="button" @click="closeStartModal">Got it</button>
          </div>

          <template v-else>
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
            <div v-else-if="!filteredExercises.length" class="modal-list-status">No exercises found.</div>

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
        </template>

        <template v-else>
          <header class="modal-header">
            <button class="modal-icon-button modal-back-button" type="button" aria-label="Back" @click="handleEditorBack">←</button>
            <div class="modal-heading">
              <p>{{ selectedDateLong }}</p>
              <h2>{{ editorTitle }}</h2>
            </div>
            <button class="modal-icon-button" type="button" aria-label="Close" @click="closeStartModal">×</button>
          </header>

          <div v-if="selectedExercise" class="set-editor">
            <div class="selected-exercise-card" :style="exerciseStyle(selectedExercise)">
              <span class="exercise-color-dot"></span>
              <div>
                <strong>{{ selectedExercise.name }}</strong>
                <small>{{ selectedExercise.categoryName }}</small>
              </div>
            </div>

            <div class="session-metrics" aria-label="Current exercise totals">
              <span><strong>{{ draftStats.sets }}</strong><small>sets</small></span>
              <span><strong>{{ draftStats.reps }}</strong><small>reps</small></span>
              <span><strong>{{ formatNumber(draftStats.volume) }}</strong><small>kg volume</small></span>
            </div>

            <div class="previous-session-line">
              <span>Previous</span>
              <strong>{{ previousDate ? formatDate(previousDate) : 'No previous workout' }}</strong>
            </div>

            <div class="sets-grid sets-grid-header" aria-hidden="true">
              <span>Set</span>
              <span>Previous</span>
              <span>kg</span>
              <span>Reps</span>
              <span></span>
            </div>

            <div class="sets-editor-list">
              <div v-for="(set, index) in draftSets" :key="index" class="sets-grid set-input-row">
                <span class="set-number">{{ index + 1 }}</span>
                <span class="previous-set">{{ previousSetLabel(index) }}</span>
                <input v-model="set.weight" class="set-input" type="text" inputmode="decimal" placeholder="0" aria-label="Weight in kilograms" @input="deleteConfirming = false" />
                <input v-model="set.reps" class="set-input" type="number" inputmode="numeric" min="1" step="1" placeholder="0" aria-label="Repetitions" @input="deleteConfirming = false" />
                <button class="remove-set-button" type="button" aria-label="Remove set" @click="removeSet(index)">−</button>
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
