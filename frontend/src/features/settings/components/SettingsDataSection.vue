<script setup>
import { computed, ref } from 'vue'
import TypedConfirmationModal from '../../../shared/components/TypedConfirmationModal.vue'
import { useFitNotesBackup } from '../composables/useFitNotesBackup'
import ExportDataModal from './ExportDataModal.vue'

const props = defineProps({
  summary: { type: Object, required: true },
})

const emit = defineEmits(['data-imported', 'data-deleted'])
const summary = computed(readSummary)
const confirmationAction = ref('')
const exportOpen = ref(false)
const confirmationOpen = computed(readConfirmationOpen)
const confirmationTitle = computed(readConfirmationTitle)
const confirmationMessage = computed(readConfirmationMessage)
const confirmationLabel = computed(readConfirmationLabel)
const confirmationBusy = computed(readConfirmationBusy)

const {
  csvExportError,
  csvExportFileName,
  csvExporting,
  csvExportUrl,
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
  prepareCsvExport,
  selectFile,
} = useFitNotesBackup(summary)

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

function openDeleteConfirmation() {
  openConfirmation('delete')
}

async function openExport() {
  exportOpen.value = true
  await Promise.all([prepareExport(), prepareCsvExport()])
}

function closeExport() {
  exportOpen.value = false
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
  return 'This replaces all current data on this device with the selected FitNotes file.'
}

function readConfirmationLabel() {
  return confirmationAction.value === 'delete' ? 'Delete data' : 'Replace data'
}

function readConfirmationBusy() {
  return confirmationAction.value === 'delete' ? deleting.value : importing.value
}
</script>

<template>
  <section id="settings-data-import" class="settings-card settings-data-import">
    <div class="settings-section-heading">
      <div>
        <p class="eyebrow">DATA</p>
        <h2>Import, export and delete</h2>
      </div>
    </div>

    <section class="upload-card settings-upload-card">
      <label class="file-picker">
        <input type="file" accept=".fitnotes,.csv" @change="onFileChange" />
        <span>Choose data file</span>
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
      <button class="settings-export-button" type="button" @click="openExport">
        Export data
      </button>
    </div>

    <div v-if="hasCurrentData" class="settings-data-action">
      <div>
        <strong>Delete current data</strong>
        <p>Remove the imported backup and all workout data stored on this device.</p>
      </div>
      <button
        class="settings-delete-button"
        type="button"
        :disabled="deleting"
        @click="openDeleteConfirmation"
      >
        {{ deleting ? 'Deleting…' : 'Delete data' }}
      </button>
    </div>

    <p v-if="deleteError" class="settings-delete-error">{{ deleteError }}</p>
  </section>

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

  <ExportDataModal
    :open="exportOpen"
    :csv-error="csvExportError"
    :csv-file-name="csvExportFileName"
    :csv-url="csvExportUrl"
    :fitnotes-error="exportError"
    :fitnotes-file-name="exportFileName"
    :fitnotes-url="exportUrl"
    :preparing-fitnotes="exporting"
    :preparing-csv="csvExporting"
    @close="closeExport"
  />
</template>
