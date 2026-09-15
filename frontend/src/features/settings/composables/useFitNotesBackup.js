import { computed, onBeforeUnmount, ref } from 'vue'
import { createFitNotesCsvExport, createFitNotesExport, parseFitNotesFile } from '../../../fitnotes'
import {
  clearLocalData,
  getFitNotesCsvExportData,
  getFitNotesExportData,
  saveFitNotesImport,
} from '../../../data/repositories/backupRepository'
import { requestPersistentStorage } from '../../../data/browserStorage'
import { friendlyError } from '../../../shared/utils/errors'
import { createBackupFileName, createCsvFileName } from '../backupFileName'

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
  const csvExporting = ref(false)
  const csvExportError = ref('')
  const csvExportUrl = ref('')
  const csvExportFileName = ref('')
  let exportSequence = 0
  let csvExportSequence = 0

  const fileLabel = computed(() => selectedFile.value?.name || 'No file selected')
  const hasCurrentData = computed(() => summary.value?.isEmpty !== true)

  onBeforeUnmount(clearExports)

  function selectFile(file) {
    selectedFile.value = file
    importError.value = ''
    exportError.value = ''
    deleteError.value = ''
  }

  async function importSelectedFile() {
    if (!selectedFile.value) {
      importError.value = 'Select a .fitnotes or .csv file first.'
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

  async function prepareExport(force = false, backupStored = summary.value?.backupStored) {
    clearExport()
    const sequence = exportSequence
    if (!force && !backupStored) return

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

  async function prepareCsvExport() {
    clearCsvExport()
    const sequence = csvExportSequence
    csvExporting.value = true
    csvExportError.value = ''

    try {
      const data = await getFitNotesCsvExportData()
      const csv = createFitNotesCsvExport(data)
      if (sequence !== csvExportSequence) return

      csvExportFileName.value = createCsvFileName()
      csvExportUrl.value = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    } catch (error) {
      if (sequence === csvExportSequence) csvExportError.value = friendlyError(error)
    } finally {
      if (sequence === csvExportSequence) csvExporting.value = false
    }
  }

  async function deleteCurrentData() {
    if (!hasCurrentData.value || deleting.value) return false

    deleting.value = true
    deleteError.value = ''

    try {
      await clearLocalData()
      deleteError.value = ''
      clearExports()
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

  function clearCsvExport() {
    csvExportSequence += 1
    if (csvExportUrl.value) URL.revokeObjectURL(csvExportUrl.value)
    csvExportUrl.value = ''
    csvExportFileName.value = ''
    csvExporting.value = false
  }

  function clearExports() {
    clearExport()
    clearCsvExport()
  }

  return {
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
  }
}
