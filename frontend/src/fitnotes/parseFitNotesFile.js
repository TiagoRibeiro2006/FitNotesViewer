import { parseFitNotesDatabase } from './parseFitNotesDatabase'
import { validateFitNotesFile, validateSqliteDatabase } from './fitNotesValidation'

export async function parseFitNotesFile(file) {
  validateFitNotesFile(file)

  const bytes = new Uint8Array(await file.arrayBuffer())
  validateSqliteDatabase(bytes)
  const parsed = await parseFitNotesDatabase(file, bytes)

  return { bytes, parsed }
}
