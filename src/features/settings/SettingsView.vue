<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ActionModal from '../../shared/components/ActionModal.vue'
import SettingsNavigationRow from './components/SettingsNavigationRow.vue'
import AppSectionHeader from '../../shared/components/AppSectionHeader.vue'
import CatalogManagementModal from '../catalog/CatalogManagementModal.vue'
import SettingsDataSection from './components/SettingsDataSection.vue'
import SettingsManagementSection from './components/SettingsManagementSection.vue'
import SettingsUnitsSection from './components/SettingsUnitsSection.vue'
import SettingsAppearanceSection from './components/SettingsAppearanceSection.vue'
import SettingsPreviewSection from './components/SettingsPreviewSection.vue'
import SettingsThemeSection from './components/SettingsThemeSection.vue'
import SettingsAccentSection from './components/SettingsAccentSection.vue'
import SettingsHomeSection from './components/SettingsHomeSection.vue'
import { searchSettings } from './settingsSearch.js'

const props = defineProps({
  summary: { type: Object, required: true },
  focusDataImport: { type: Boolean, default: false },
})

const emit = defineEmits([
  'data-imported',
  'data-deleted',
  'manage-body-items',
])
const catalogMode = ref('muscles')
const catalogOpen = ref(false)
const activeSection = ref('')
const searchQuery = ref('')
const searchInput = ref(null)
const sections = [
  { id: 'management', title: 'Manage items', description: 'Muscles, exercises and body measurements', icon: 'M4 7h16M4 12h16M4 17h16M8 5v4m8 1v4m-6 1v4' },
  { id: 'appearance', title: 'Theme & colours', description: 'Dark, Light or Soft and your accent colour', icon: 'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 .8-2.8H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3ZM7 10h.01M10 7h.01M15 7h.01M7 15h.01' },
  { id: 'icons', title: 'Icons & visibility', description: 'Muscle display and icons by page', icon: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z' },
  { id: 'home', title: 'Home & workout', description: 'Progress stars on Home and in Log / Edit Exercise', icon: 'm3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7' },
  { id: 'body', title: 'Body', description: 'Body icon colour · Coming soon', icon: 'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 21v-3a7 7 0 0 1 14 0v3' },
  { id: 'units', title: 'Weight unit', description: 'Choose kilograms or pounds', icon: 'M5 7h14l2 14H3L5 7ZM9 7V5a3 3 0 0 1 6 0v2M12 11v5m-2-3 2-2 2 2' },
  { id: 'data', title: 'Data & backups', description: 'Import, export or delete your local data', icon: 'M5 3h10l4 4v14H5V3Zm10 0v5h4M12 11v6m-3-3 3 3 3-3' },
]
const sectionTitle = computed(readSectionTitle)
const visibleSections = computed(readVisibleSections)

function readVisibleSections() {
  return searchSettings(sections, searchQuery.value)
}

function clearSearch() {
  searchQuery.value = ''
  searchInput.value?.focus()
}

function readSectionTitle() {
  for (const section of sections) {
    if (section.id === activeSection.value) return section.title
  }
  return ''
}

function openSection(sectionId) {
  activeSection.value = sectionId
}

function closeSection() {
  activeSection.value = ''
}

onMounted(initializeSettingsView)
watch(readFocusDataImport, focusDataImport)

function initializeSettingsView() {
  if (props.focusDataImport) {
    void scrollToDataImport()
    return
  }
  scrollToTop()
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function readFocusDataImport() {
  return props.focusDataImport
}

function focusDataImport(shouldFocus) {
  if (shouldFocus) void scrollToDataImport()
}

async function scrollToDataImport() {
  openSection('data')
  await nextTick()
  document.getElementById('settings-data-import')?.scrollIntoView({
    block: 'start',
    behavior: 'auto',
  })
}

function openCatalog(mode) {
  closeSection()
  catalogMode.value = mode
  catalogOpen.value = true
}

function openMuscles() {
  openCatalog('muscles')
}

function openExercises() {
  openCatalog('exercises')
}

function openBodyItems() {
  closeSection()
  emit('manage-body-items')
}

function closeCatalog() {
  catalogOpen.value = false
}

function dataImported(summary) {
  emit('data-imported', summary)
}

function dataDeleted() {
  emit('data-deleted')
}
</script>

<template>
  <AppSectionHeader title="Settings" />

  <div class="settings-sections">
    <label class="settings-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
      <input ref="searchInput" v-model="searchQuery" type="search" placeholder="Search settings" aria-label="Search settings" autocomplete="off" @keydown.esc.prevent="clearSearch" />
      <button v-if="searchQuery" class="settings-search-clear" type="button" aria-label="Clear search" @click="clearSearch">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </label>
    <p class="settings-introduction">Make FitNotes your own. Choose a section to get started.</p>
    <nav class="settings-navigation" aria-label="Settings sections">
      <SettingsNavigationRow v-for="section in visibleSections" :key="section.id" :section="section" @open="openSection" />
      <p v-if="!visibleSections.length" class="settings-search-empty" role="status">No settings found. Try another search.</p>
    </nav>
    <p v-if="searchQuery.trim() && visibleSections.length" class="settings-search-status" role="status">{{ visibleSections.length }} {{ visibleSections.length === 1 ? 'section found' : 'sections found' }}</p>
    <p class="settings-local-note">Your preferences and data stay on this device.</p>
  </div>

  <ActionModal :open="activeSection !== ''" :title="sectionTitle" :aria-label="sectionTitle || 'Settings'" modal-class="settings-detail-modal" layer-class="settings-detail-layer" @close="closeSection">
    <SettingsManagementSection
      v-if="activeSection === 'management'"
      @manage-muscles="openMuscles"
      @manage-exercises="openExercises"
      @manage-body-items="openBodyItems"
    />

    <SettingsAppearanceSection v-else-if="activeSection === 'icons'" />

    <template v-else-if="activeSection === 'appearance'">
      <SettingsThemeSection />
      <SettingsAccentSection />
    </template>

    <SettingsHomeSection v-else-if="activeSection === 'home'" />
    <SettingsPreviewSection v-else-if="activeSection === 'body'" section="body" />

    <SettingsUnitsSection v-else-if="activeSection === 'units'" />

    <SettingsDataSection
      v-else-if="activeSection === 'data'"
      :summary="summary"
      @data-imported="dataImported"
      @data-deleted="dataDeleted"
    />
  </ActionModal>

  <CatalogManagementModal
    :open="catalogOpen"
    :mode="catalogMode"
    @close="closeCatalog"
  />
</template>
