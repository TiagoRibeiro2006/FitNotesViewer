import { readBackupPreferences, updateBackupPreferences } from '../../../data/repositories/automaticBackupRepository.js'
import { getSummary } from '../../../data/repositories/summaryRepository.js'
import { getFitNotesExportData, getFitNotesCsvExportData } from '../../../data/repositories/backupRepository.js'
import { createFitNotesExport } from '../../../fitnotes/createFitNotesExport.js'
import { createFitNotesCsvExport } from '../../../fitnotes/createFitNotesCsvExport.js'

export function supportsAutomaticBackups() {
  return typeof window !== 'undefined' && window.isSecureContext && typeof window.showDirectoryPicker === 'function'
}

export function backupIsDue(settings, now = Date.now()) {
  const days = Math.min(30, Math.max(1, Number(settings.intervalDays) || 7))
  const last = Date.parse(settings.lastBackupAt)
  return !Number.isFinite(last) || now - last >= days * 86400000
}

export async function createCurrentBackup() {
  const source = await getFitNotesExportData()
  if (source) return { extension: 'fitnotes', data: await createFitNotesExport(source.bytes, source) }
  return { extension: 'csv', data: createFitNotesCsvExport(await getFitNotesCsvExportData()) }
}

// Close and verify the new file before deleting any tracked older backups.
export async function writeAutomaticBackup(directory, backup, name) {
  const file = await directory.getFileHandle(name, { create: true })
  const stream = await file.createWritable()
  try {
    await stream.write(backup.data)
    await stream.close()
  } catch (error) {
    await stream.abort().catch(() => {})
    throw error
  }
  const saved = await file.getFile()
  const expected = new Blob([backup.data]).size
  if (saved.size !== expected || !saved.size) throw new Error('The backup file could not be verified.')
}

export async function removeOlderBackups(directory, names) {
  const remaining = []
  for (const name of names) {
    // Never enumerate or delete unrelated files in the selected folder.
    if (!/^FitNotes_Auto_[\w-]+\.(fitnotes|csv)$/.test(name)) continue
    try {
      await directory.removeEntry(name)
    } catch (error) {
      if (error.name !== 'NotFoundError') remaining.push(name)
    }
  }
  return remaining
}

let running
export function checkAutomaticBackup() {
  if (running) return running
  const task = async () => {
    try {
      const settings = await readBackupPreferences()
      if (!settings.enabled || !settings.directory || !backupIsDue(settings)) return
      const summary = await getSummary()
      if (!summary || summary.isEmpty) return
      if (await settings.directory.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        throw new Error('Folder access expired. Open Data & backups and choose the folder again.')
      }
      const backup = await createCurrentBackup()
      const name = `FitNotes_Auto_${new Date().toISOString().replace(/[:.]/g, '-')}_${crypto.randomUUID()}.${backup.extension}`
      await writeAutomaticBackup(settings.directory, backup, name)
      // Persist success before cleanup, so a deletion error cannot cause repeat exports.
      await updateBackupPreferences({ lastBackupAt: new Date().toISOString(), files: [...settings.files, name], error: '' })
      const remaining = settings.keepLatestOnly
        ? await removeOlderBackups(settings.directory, settings.files)
        : settings.files
      await updateBackupPreferences({ files: [...remaining, name], error: remaining.length && settings.keepLatestOnly ? 'Backup saved, but some older backups could not be removed.' : '' })
    } catch (error) {
      await updateBackupPreferences({ error: error.message || 'Automatic backup failed.' }).catch(() => {})
    } finally {
      window.dispatchEvent(new Event('automatic-backup-updated'))
    }
  }
  running = (navigator.locks ? navigator.locks.request('fitnotes-automatic-backup', task) : task())
    .finally(() => { running = null })
  return running
}
