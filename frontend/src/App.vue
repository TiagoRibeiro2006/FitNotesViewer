<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppBottomNavigation from './app/AppBottomNavigation.vue'
import { warmUpSqliteEngine } from './fitnotes'
import BodyTrackerView from './features/body/BodyTrackerView.vue'
import CalendarView from './features/calendar/CalendarView.vue'
import CalendarList from './features/calendar/components/CalendarList.vue'
import { createCalendarMonths, monthKey } from './features/calendar/calendarUtils'
import SettingsView from './features/settings/SettingsView.vue'
import { exerciseMeta } from './features/workouts/exerciseFormatters'
import BaseModal from './shared/components/BaseModal.vue'
import { createEmptySummary } from './shared/models/summary'
import { androidColorToCss } from './shared/utils/colors'
import { formatDate, shiftDateKey, todayKey } from './shared/utils/dates'
import { friendlyError } from './shared/utils/errors'
import { formatNumber as formatBodyNumber } from './shared/utils/numbers'
import {
  copyWorkoutDay,
  deleteWorkoutExercise,
  getExerciseCatalog,
  getPreviousWorkoutSetsForExercise,
  getSummary,
  getWorkoutDateSet,
  getWorkoutSetsForDate,
  getWorkoutSetsForDateExercise,
  migrateLegacyLocalStorage,
  requestPersistentStorage,
  saveWorkoutExercise,
} from './storage'

const data = ref(createEmptySummary())
const dayExercises = ref([])
const selectedDate = ref(todayKey())
const activeView = ref('workouts')
const calendarWorkoutDates = ref(new Set())
const copyDayModalOpen = ref(false)
const copyingDay = ref(false)
const copyDayError = ref('')
let dayLoadSequence = 0

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
    data.value = createEmptySummary()
    dayExercises.value = []
  }

  void requestPersistentStorage()
  void warmUpSqliteEngine().catch(() => {})
})

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
})

watch(selectedDate, () => {
  void loadDayExercises()
})

function openBody() {
  activeView.value = 'body'
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

function openCalendar() {
  activeView.value = 'calendar'
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
  void nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
}

function openWorkoutLog() {
  activeView.value = 'workouts'
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

async function handleDataImported(summary) {
  data.value = summary
  selectedDate.value = todayKey()
  exerciseCatalog.value = []
  categories.value = []
  const [, workoutDates] = await Promise.all([loadDayExercises(), getWorkoutDateSet()])
  calendarWorkoutDates.value = workoutDates
}

function handleDataDeleted() {
  dayLoadSequence += 1
  data.value = createEmptySummary()
  dayExercises.value = []
  calendarWorkoutDates.value = new Set()
  exerciseCatalog.value = []
  categories.value = []
  selectedExercise.value = null
  previousSets.value = []
  editorHasExistingSets.value = false
  selectedDate.value = todayKey()
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

    <BodyTrackerView v-else-if="activeView === 'body'" />

    <CalendarView
      v-else-if="activeView === 'calendar'"
      :selected-date="selectedDate"
      :selected-date-label="selectedDateLong"
      @select="selectCalendarDate"
    />

    <SettingsView
      v-else-if="activeView === 'settings'"
      :summary="data"
      @data-imported="handleDataImported"
      @data-deleted="handleDataDeleted"
    />
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

</template>
