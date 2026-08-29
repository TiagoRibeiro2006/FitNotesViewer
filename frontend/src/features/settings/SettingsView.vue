<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import TypedConfirmationModal from '../../shared/components/TypedConfirmationModal.vue'
import CatalogManagementModal from '../catalog/CatalogManagementModal.vue'
import SettingsManagementSection from './components/SettingsManagementSection.vue'
import { useFitNotesBackup } from './composables/useFitNotesBackup'

const props = defineProps({
  summary: { type: Object, required: true },
})

const emit = defineEmits(['data-imported', 'data-deleted', 'manage-body-items'])
const summary = computed(readSummary)
const catalogMode = ref('muscles')
const catalogOpen = ref(false)
const confirmationAction = ref('')
const confirmationOpen = computed(readConfirmationOpen)
const confirmationTitle = computed(readConfirmationTitle)
const confirmationMessage = computed(readConfirmationMessage)
const confirmationLabel = computed(readConfirmationLabel)
const confirmationBusy = computed(readConfirmationBusy)

const {
  deleteError,
  deleting,
  exportError,
  exportFileName,
  exporting,
  exportUrl,
  fileLabel,
  hasCurrentData,
  importError,
  importing,
  selectedFile,
  deleteCurrentData,
  importSelectedFile,
  prepareExport,
  selectFile,
} = useFitNotesBackup(summary)

onMounted(initializeSettings)

function initializeSettings() {
  void prepareExport()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function readSummary() {
  return props.summary
}

function onFileChange(event) {
  selectFile(event.target.files?.[0] ?? null)
}

async function importFile() {
  const importedSummary = await importSelectedFile()
  if (!importedSummary) return

  emit('data-imported', importedSummary)
  await nextTick()
  await prepareExport(true)
}

function handleImport() {
  if (hasCurrentData.value) {
    openConfirmation('replace')
    return
  }
  void importFile()
}

async function removeData() {
  if (await deleteCurrentData()) emit('data-deleted')
}

function openCatalog(mode) {
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
  emit('manage-body-items')
}

function closeCatalog() {
  catalogOpen.value = false
}

function openConfirmation(action) {
  confirmationAction.value = action
}

function closeConfirmation() {
  if (!confirmationBusy.value) confirmationAction.value = ''
}

async function confirmAction() {
  const action = confirmationAction.value
  confirmationAction.value = ''
  if (action === 'replace') await importFile()
  if (action === 'delete') await removeData()
}

function readConfirmationOpen() {
  return confirmationAction.value !== ''
}

function readConfirmationTitle() {
  return confirmationAction.value === 'delete' ? 'Delete current data' : 'Replace current data'
}

function readConfirmationMessage() {
  if (confirmationAction.value === 'delete') {
    return 'This permanently removes the imported backup and all data stored on this device.'
  }
  return 'This replaces all current data on this device with the selected FitNotes backup.'
}

function readConfirmationLabel() {
  return confirmationAction.value === 'delete' ? 'Delete data' : 'Replace data'
}

function readConfirmationBusy() {
  return confirmationAction.value === 'delete' ? deleting.value : importing.value
}
</script>

<template>
  <div class="settings-sections">
    <SettingsManagementSection
      @manage-muscles="openMuscles"
      @manage-exercises="openExercises"
      @manage-body-items="openBodyItems"
    />

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

        <button class="primary-button" :disabled="importing || !selectedFile" @click="handleImport">
          {{ importing ? 'Importing…' : hasCurrentData ? 'Replace data' : 'Import' }}
        </button>

        <p v-if="importError" class="error-message">{{ importError }}</p>
      </section>

      <div v-if="hasCurrentData" class="settings-data-action">
        <div>
          <strong>Export current data</strong>
          <p>Download the current workout data as a FitNotes backup.</p>
        </div>
        <a v-if="exportUrl" class="settings-export-button" :href="exportUrl" :download="exportFileName">
          Export .fitnotes
        </a>
        <button v-else class="settings-export-button" type="button" disabled>
          {{ exporting ? 'Preparing…' : 'Export unavailable' }}
        </button>
      </div>

      <p v-if="exportError" class="settings-export-error">{{ exportError }}</p>

      <div v-if="hasCurrentData" class="settings-data-action">
        <div>
          <strong>Delete current data</strong>
          <p>Remove the imported backup and all workout data stored on this device.</p>
        </div>
        <button
          class="settings-delete-button"
          type="button"
          :disabled="deleting"
          @click="openConfirmation('delete')"
        >
          {{ deleting ? 'Deleting…' : 'Delete data' }}
        </button>
      </div>

      <p v-if="deleteError" class="settings-delete-error">{{ deleteError }}</p>
    </section>
  </div>

  <CatalogManagementModal
    :open="catalogOpen"
    :mode="catalogMode"
    @close="closeCatalog"
  />

  <TypedConfirmationModal
    :open="confirmationOpen"
    :title="confirmationTitle"
    :message="confirmationMessage"
    :confirm-label="confirmationLabel"
    :busy="confirmationBusy"
    :danger="confirmationAction === 'delete'"
    @close="closeConfirmation"
    @confirm="confirmAction"
  />
</template>
