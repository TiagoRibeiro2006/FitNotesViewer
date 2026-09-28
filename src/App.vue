<script setup>
import { computed, onMounted, ref } from 'vue'
import AppBottomNavigation from './app/AppBottomNavigation.vue'
import {
  loadApplicationSummary,
  startBackgroundServices,
} from './app/services/appInitializationService'
import { useAppNavigation } from './app/useAppNavigation'
import BodyTrackerView from './features/body/BodyTrackerView.vue'
import CalendarView from './features/calendar/CalendarView.vue'
import ChartsView from './features/charts/ChartsView.vue'
import EmptyDataImportPrompt from './features/onboarding/EmptyDataImportPrompt.vue'
import SettingsView from './features/settings/SettingsView.vue'
import WorkoutLogView from './features/workouts/WorkoutLogView.vue'
import { createEmptySummary } from './shared/models/summary'
import { useAppInitialization } from './app/useAppInitialization'

const { summary, appReady, initializationError, initializing, initializeApp } = useAppInitialization(
  loadApplicationSummary,
  startBackgroundServices,
)
const bodyManagementRequested = ref(false)
const settingsImportRequested = ref(false)
const emptyImportPromptDismissed = ref(false)
const showEmptyImportPrompt = computed(readEmptyImportPromptVisibility)

const {
  activeView,
  selectedDate,
  navigateTo,
  resetSelectedDate,
  selectCalendarDate,
} = useAppNavigation()

onMounted(initializeApp)

function handleWorkoutChanged(updatedSummary) {
  summary.value = updatedSummary
}

function handleDataImported(importedSummary) {
  summary.value = importedSummary
  settingsImportRequested.value = false
  resetSelectedDate()
}

function handleDataDeleted() {
  summary.value = createEmptySummary()
  emptyImportPromptDismissed.value = false
  resetSelectedDate()
}

function handleNavigation(view) {
  bodyManagementRequested.value = false
  settingsImportRequested.value = false
  navigateTo(view)
}

function openBodyManagement() {
  bodyManagementRequested.value = true
  navigateTo('body')
}

function readEmptyImportPromptVisibility() {
  return appReady.value
    && summary.value?.isEmpty === true
    && !emptyImportPromptDismissed.value
}

function dismissEmptyImportPrompt() {
  emptyImportPromptDismissed.value = true
}

function openDataImport() {
  dismissEmptyImportPrompt()
  settingsImportRequested.value = true
  navigateTo('settings')
}
</script>

<template>
  <main v-if="!appReady" class="page-shell">
    <section v-if="initializationError" class="settings-card" role="alert">
      <h1>Could not open your saved data</h1>
      <p>{{ initializationError }}</p>
      <button class="primary-button" :disabled="initializing" @click="initializeApp">Try again</button>
    </section>
    <p v-else role="status">Loading your data…</p>
  </main>
  <main v-else class="page-shell">
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
      :focus-data-import="settingsImportRequested"
      @data-imported="handleDataImported"
      @data-deleted="handleDataDeleted"
      @manage-body-items="openBodyManagement"
    />
  </main>

  <AppBottomNavigation v-if="appReady" :active-view="activeView" @navigate="handleNavigation" />

  <EmptyDataImportPrompt
    :open="showEmptyImportPrompt"
    @close="dismissEmptyImportPrompt"
    @import="openDataImport"
  />
</template>
