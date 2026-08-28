<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import AppBottomNavigation from './app/AppBottomNavigation.vue'
import { warmUpSqliteEngine } from './fitnotes'
import BodyTrackerView from './features/body/BodyTrackerView.vue'
import CalendarView from './features/calendar/CalendarView.vue'
import SettingsView from './features/settings/SettingsView.vue'
import WorkoutLogView from './features/workouts/WorkoutLogView.vue'
import { createEmptySummary } from './shared/models/summary'
import { formatDate, todayKey } from './shared/utils/dates'
import {
  getSummary,
  migrateLegacyLocalStorage,
  requestPersistentStorage,
} from './storage'

const data = ref(createEmptySummary())
const selectedDate = ref(todayKey())
const activeView = ref('workouts')
const appReady = ref(false)

const selectedDateLong = computed(() => formatDate(selectedDate.value))

onMounted(async () => {
  try {
    await migrateLegacyLocalStorage()
    data.value = await getSummary() ?? createEmptySummary()
  } catch {
    data.value = createEmptySummary()
  } finally {
    appReady.value = true
  }

  void requestPersistentStorage()
  void warmUpSqliteEngine().catch(() => {})
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

function handleWorkoutChanged(summary) {
  data.value = summary
}

function handleDataImported(summary) {
  data.value = summary
  selectedDate.value = todayKey()
}

function handleDataDeleted() {
  data.value = createEmptySummary()
  selectedDate.value = todayKey()
}
</script>

<template>
  <main class="page-shell">
    <WorkoutLogView
      v-if="activeView === 'workouts'"
      :selected-date="selectedDate"
      :ready="appReady"
      @update:selected-date="selectedDate = $event"
      @summary-changed="handleWorkoutChanged"
    />

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
</template>
