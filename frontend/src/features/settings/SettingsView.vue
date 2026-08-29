<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import CatalogManagementModal from '../catalog/CatalogManagementModal.vue'
import { useFitNotesBackup } from './composables/useFitNotesBackup'

const props = defineProps({
  summary: { type: Object, required: true },
})

const emit = defineEmits(['data-imported', 'data-deleted'])
const summary = computed(() => props.summary)
const catalogMode = ref('muscles')
const catalogOpen = ref(false)

const {
  deleteConfirming,
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

onMounted(() => {
  void prepareExport()
  window.scrollTo({ top: 0, behavior: 'auto' })
})

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

async function removeData() {
  if (await deleteCurrentData()) emit('data-deleted')
}

function openCatalog(mode) {
  catalogMode.value = mode
  catalogOpen.value = true
}
</script>

<template>
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

      <button class="primary-button" :disabled="importing || !selectedFile" @click="importFile">
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

    <div class="settings-data-action">
      <div>
        <strong>Manage muscles</strong>
        <p>Rename muscles and change their colours.</p>
      </div>
      <button class="settings-export-button" type="button" @click="openCatalog('muscles')">
        Open muscles
      </button>
    </div>

    <div class="settings-data-action">
      <div>
        <strong>Manage exercises</strong>
        <p>Rename exercises and change their muscle.</p>
      </div>
      <button class="settings-export-button" type="button" @click="openCatalog('exercises')">
        Open exercises
      </button>
    </div>

    <div v-if="hasCurrentData" class="settings-data-action">
      <div>
        <strong>Delete current data</strong>
        <p>Remove the imported backup and all workout data stored on this device.</p>
      </div>
      <button
        class="settings-delete-button"
        :class="{ 'is-confirming': deleteConfirming }"
        type="button"
        :disabled="deleting"
        @click="removeData"
      >
        {{ deleting ? 'Deleting…' : deleteConfirming ? 'Tap again to delete' : 'Delete data' }}
      </button>
    </div>

    <p v-if="deleteError" class="settings-delete-error">{{ deleteError }}</p>
  </section>

  <CatalogManagementModal
    :open="catalogOpen"
    :mode="catalogMode"
    @close="catalogOpen = false"
  />
</template>
