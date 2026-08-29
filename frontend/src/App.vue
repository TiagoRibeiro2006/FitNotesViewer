<script setup>
import { onMounted, ref } from 'vue'
import AppBottomNavigation from './app/AppBottomNavigation.vue'
import { useAppNavigation } from './app/useAppNavigation'
import { requestPersistentStorage } from './data/browserStorage'
import { migrateLegacyLocalStorage } from './data/repositories/backupRepository'
import { getSummary } from './data/repositories/summaryRepository'
import BodyTrackerView from './features/body/BodyTrackerView.vue'
import CalendarView from './features/calendar/CalendarView.vue'
import SettingsView from './features/settings/SettingsView.vue'
import WorkoutLogView from './features/workouts/WorkoutLogView.vue'
import { warmUpSqliteEngine } from './fitnotes'
import { createEmptySummary } from './shared/models/summary'

const summary = ref(createEmptySummary())
const appReady = ref(false)

const {
  activeView,
  selectedDate,
  selectedDateLong,
  navigateTo,
  resetSelectedDate,
  selectCalendarDate,
} = useAppNavigation()

onMounted(initializeApp)

async function initializeApp() {
  try {
    await migrateLegacyLocalStorage()
    summary.value = await getSummary() ?? createEmptySummary()
  } catch {
    summary.value = createEmptySummary()
  } finally {
    appReady.value = true
  }

  void requestPersistentStorage()
  void warmUpDatabaseEngine()
}

async function warmUpDatabaseEngine() {
  try {
    await warmUpSqliteEngine()
    return true
  } catch {
    return false
  }
}

function handleWorkoutChanged(updatedSummary) {
  summary.value = updatedSummary
}

function handleDataImported(importedSummary) {
  summary.value = importedSummary
  resetSelectedDate()
}

function handleDataDeleted() {
  summary.value = createEmptySummary()
  resetSelectedDate()
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
      :summary="summary"
      @data-imported="handleDataImported"
      @data-deleted="handleDataDeleted"
    />
  </main>

  <AppBottomNavigation :active-view="activeView" @navigate="navigateTo" />
</template>
