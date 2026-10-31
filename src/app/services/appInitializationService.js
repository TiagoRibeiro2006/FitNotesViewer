import { requestPersistentStorage } from '../../data/browserStorage'
import { migrateLegacyLocalStorage } from '../../data/repositories/backupRepository'
import { getSummary } from '../../data/repositories/summaryRepository'
import { warmUpSqliteEngine } from '../../fitnotes'
import { createEmptySummary } from '../../shared/models/summary'
import { checkAutomaticBackup } from '../../features/settings/services/automaticBackupService.js'

export async function loadApplicationSummary() {
  await migrateLegacyLocalStorage()
  return await getSummary() ?? createEmptySummary()
}

export function startBackgroundServices() {
  void requestPersistentStorage()
  void warmUpDatabaseEngine()
  void checkAutomaticBackup()
}

async function warmUpDatabaseEngine() {
  try {
    await warmUpSqliteEngine()
  } catch {
    return
  }
}
