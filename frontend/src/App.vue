<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AppBottomNavigation from './app/AppBottomNavigation.vue'
import { warmUpSqliteEngine } from './fitnotes'
import BodyTrackerView from './features/body/BodyTrackerView.vue'
import CalendarView from './features/calendar/CalendarView.vue'
import SettingsView from './features/settings/SettingsView.vue'
import CopyWorkoutDayModal from './features/workouts/components/CopyWorkoutDayModal.vue'
import WorkoutExerciseModal from './features/workouts/components/WorkoutExerciseModal.vue'
import { createEmptySummary } from './shared/models/summary'
import { formatDate, shiftDateKey, todayKey } from './shared/utils/dates'
import { formatNumber as formatBodyNumber } from './shared/utils/numbers'
import {
  getSummary,
  getWorkoutSetsForDate,
  migrateLegacyLocalStorage,
  requestPersistentStorage,
} from './storage'

const data = ref(createEmptySummary())
const dayExercises = ref([])
const selectedDate = ref(todayKey())
const activeView = ref('workouts')
const copyDayModalOpen = ref(false)
let dayLoadSequence = 0

const workoutModalOpen = ref(false)
const workoutModalExercise = ref(null)

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

function openCopyDayModal() {
  copyDayModalOpen.value = true
}

function closeCopyDayModal() {
  copyDayModalOpen.value = false
}

async function handleWorkoutCopied(summary) {
  data.value = summary
  await loadDayExercises()
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

function openWorkoutModal() {
  workoutModalExercise.value = null
  workoutModalOpen.value = true
}

function editDayExercise(dayExercise) {
  workoutModalExercise.value = dayExercise
  workoutModalOpen.value = true
}

function closeWorkoutModal() {
  workoutModalOpen.value = false
  workoutModalExercise.value = null
}

async function handleWorkoutChanged(summary) {
  data.value = summary
  await loadDayExercises()
}

async function handleDataImported(summary) {
  data.value = summary
  selectedDate.value = todayKey()
  await loadDayExercises()
}

function handleDataDeleted() {
  dayLoadSequence += 1
  data.value = createEmptySummary()
  dayExercises.value = []
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

  <WorkoutExerciseModal
    :open="workoutModalOpen"
    :date="selectedDate"
    :date-label="selectedDateLong"
    :exercise="workoutModalExercise"
    @close="closeWorkoutModal"
    @data-changed="handleWorkoutChanged"
  />

  <CopyWorkoutDayModal
    :open="copyDayModalOpen"
    :target-date="selectedDate"
    :target-date-label="selectedDateLong"
    @close="closeCopyDayModal"
    @copied="handleWorkoutCopied"
  />

</template>
