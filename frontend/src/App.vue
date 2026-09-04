<script setup>
import { onMounted, ref } from 'vue'
import AppBottomNavigation from './app/AppBottomNavigation.vue'
import {
  loadApplicationSummary,
  startBackgroundServices,
} from './app/services/appInitializationService'
import { useAppNavigation } from './app/useAppNavigation'
import BodyTrackerView from './features/body/BodyTrackerView.vue'
import CalendarView from './features/calendar/CalendarView.vue'
import ChartsView from './features/charts/ChartsView.vue'
import SettingsView from './features/settings/SettingsView.vue'
import WorkoutLogView from './features/workouts/WorkoutLogView.vue'
import { createEmptySummary } from './shared/models/summary'

const summary = ref(createEmptySummary())
const appReady = ref(false)
const bodyManagementRequested = ref(false)

const {
  activeView,
  selectedDate,
  navigateTo,
  resetSelectedDate,
  selectCalendarDate,
} = useAppNavigation()

onMounted(initializeApp)

async function initializeApp() {
  summary.value = await loadApplicationSummary()
  appReady.value = true
  startBackgroundServices()
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

function handleNavigation(view) {
  bodyManagementRequested.value = false
  navigateTo(view)
}

function openBodyManagement() {
  bodyManagementRequested.value = true
  navigateTo('body')
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

    <BodyTrackerView
      v-else-if="activeView === 'body'"
      :start-managing="bodyManagementRequested"
    />

    <CalendarView
      v-else-if="activeView === 'calendar'"
      :selected-date="selectedDate"
      @select="selectCalendarDate"
    />

    <ChartsView v-else-if="activeView === 'charts'" />

    <SettingsView
      v-else-if="activeView === 'settings'"
      :summary="summary"
      @data-imported="handleDataImported"
      @data-deleted="handleDataDeleted"
      @manage-body-items="openBodyManagement"
    />
  </main>

  <AppBottomNavigation :active-view="activeView" @navigate="handleNavigation" />
</template>
