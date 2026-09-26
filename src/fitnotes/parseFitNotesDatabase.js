import { loadSqliteEngine } from './sqliteEngine'
import { readFitNotesDatabase } from './readFitNotesDatabase'

export async function parseFitNotesDatabase(file, bytes) {
  const SQL = await loadSqliteEngine()
  const database = new SQL.Database(bytes)

  try {
    return readFitNotesDatabase(file, database)
  } finally {
    database.close()
  }
}
