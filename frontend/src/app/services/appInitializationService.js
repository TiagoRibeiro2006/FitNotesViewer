import { requestPersistentStorage } from '../../data/browserStorage'
import { migrateLegacyLocalStorage } from '../../data/repositories/backupRepository'
import { getSummary } from '../../data/repositories/summaryRepository'
import { warmUpSqliteEngine } from '../../fitnotes'
import { createEmptySummary } from '../../shared/models/summary'

export async function loadApplicationSummary() {
  try {
    await migrateLegacyLocalStorage()
    return await getSummary() ?? createEmptySummary()
  } catch {
    return createEmptySummary()
  }
}

export function startBackgroundServices() {
  void requestPersistentStorage()
  void warmUpDatabaseEngine()
}

async function warmUpDatabaseEngine() {
  try {
    await warmUpSqliteEngine()
  } catch {
    return
  }
}
