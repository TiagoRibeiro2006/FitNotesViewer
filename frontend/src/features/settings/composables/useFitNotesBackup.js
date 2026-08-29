import { computed, onBeforeUnmount, ref } from 'vue'
import { createFitNotesExport, parseFitNotesFile } from '../../../fitnotes'
import {
  clearLocalData,
  getFitNotesExportData,
  saveFitNotesImport,
} from '../../../data/repositories/backupRepository'
import { requestPersistentStorage } from '../../../data/browserStorage'
import { friendlyError } from '../../../shared/utils/errors'
import { createBackupFileName } from '../backupFileName'

export function useFitNotesBackup(summary) {
  const selectedFile = ref(null)
  const importError = ref('')
  const importing = ref(false)
  const deleting = ref(false)
  const deleteError = ref('')
  const exporting = ref(false)
  const exportError = ref('')
  const exportUrl = ref('')
  const exportFileName = ref('')
  let exportSequence = 0

  const fileLabel = computed(() => selectedFile.value?.name || 'No file selected')
  const hasCurrentData = computed(() => summary.value?.isEmpty !== true)

  onBeforeUnmount(clearExport)

  function selectFile(file) {
    selectedFile.value = file
    importError.value = ''
    exportError.value = ''
    deleteError.value = ''
  }

  async function importSelectedFile() {
    if (!selectedFile.value) {
      importError.value = 'Select a .fitnotes file first.'
      return null
    }

    importing.value = true
    importError.value = ''
    deleteError.value = ''

    try {
      void requestPersistentStorage()
      const { parsed, bytes } = await parseFitNotesFile(selectedFile.value)
      await saveFitNotesImport(parsed, selectedFile.value, bytes)
      return parsed.summary
    } catch (error) {
      importError.value = friendlyError(error)
      return null
    } finally {
      importing.value = false
    }
  }

  async function prepareExport(force = false) {
    clearExport()
    const sequence = exportSequence
    if (!force && !summary.value?.backupStored) return

    exporting.value = true
    exportError.value = ''

    try {
      const source = await getFitNotesExportData()
      if (!source) throw new Error('The original FitNotes backup is not available on this device.')

      const bytes = await createFitNotesExport(source.bytes, source.workoutSets)
      if (sequence !== exportSequence) return

      exportFileName.value = createBackupFileName()
      exportUrl.value = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.sqlite3' }))
    } catch (error) {
      if (sequence === exportSequence) exportError.value = friendlyError(error)
    } finally {
      if (sequence === exportSequence) exporting.value = false
    }
  }

  async function deleteCurrentData() {
    if (!hasCurrentData.value || deleting.value) return false

    deleting.value = true
    deleteError.value = ''

    try {
      await clearLocalData()
      deleteError.value = ''
      clearExport()
      return true
    } catch (error) {
      deleteError.value = friendlyError(error)
      return false
    } finally {
      deleting.value = false
    }
  }

  function clearExport() {
    exportSequence += 1
    if (exportUrl.value) URL.revokeObjectURL(exportUrl.value)
    exportUrl.value = ''
    exportFileName.value = ''
    exporting.value = false
  }

  return {
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
  }
}
