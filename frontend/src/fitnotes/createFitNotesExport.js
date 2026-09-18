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
    db.run('BEGIN TRANSACTION;')

    try {
      synchronizeFitNotesData(db, exportData)
      db.run('COMMIT;')
    } catch (error) {
      db.run('ROLLBACK;')
      throw error
    }

    return db.export()
  } finally {
    db.close()
  }
}
