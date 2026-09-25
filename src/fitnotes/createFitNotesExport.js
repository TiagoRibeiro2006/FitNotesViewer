import { validateSqliteDatabase } from './fitNotesValidation'
import { loadSqliteEngine } from './sqliteEngine'
import { ensureRequiredTables } from './sqliteHelpers'
import { synchronizeFitNotesData } from './synchronizeFitNotesData.js'

export async function createFitNotesExport(sourceBytes, data = {}) {
  const bytes = sourceBytes instanceof Uint8Array ? sourceBytes : new Uint8Array(sourceBytes)
  validateSqliteDatabase(bytes)

  const SQL = await loadSqliteEngine()
  const db = new SQL.Database(bytes)
  const exportData = Array.isArray(data) ? { workoutSets: data } : data

  try {
    ensureRequiredTables(db)
    synchronizeFitNotesData(db, exportData)

    return db.export()
  } finally {
    db.close()
  }
}
