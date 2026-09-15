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

const summary = ref(createEmptySummary())
const appReady = ref(false)
const bodyManagementRequested = ref(false)
const trainingChatRequested = ref(false)
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
  trainingChatRequested.value = false
  settingsImportRequested.value = false
  navigateTo(view)
}

function openBodyManagement() {
  bodyManagementRequested.value = true
  navigateTo('body')
}

function openTrainingChat() {
  trainingChatRequested.value = true
  navigateTo('charts')
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

    <ChartsView
      v-else-if="activeView === 'charts'"
      :open-training-chat="trainingChatRequested"
    />

    <SettingsView
      v-else-if="activeView === 'settings'"
      :summary="summary"
      :focus-data-import="settingsImportRequested"
      @data-imported="handleDataImported"
      @data-deleted="handleDataDeleted"
      @manage-body-items="openBodyManagement"
      @open-training-chat="openTrainingChat"
    />
  </main>

  <AppBottomNavigation :active-view="activeView" @navigate="handleNavigation" />

  <EmptyDataImportPrompt
    :open="showEmptyImportPrompt"
    @close="dismissEmptyImportPrompt"
    @import="openDataImport"
  />
</template>
