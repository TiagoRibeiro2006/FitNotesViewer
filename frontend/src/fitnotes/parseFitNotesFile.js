import { parseFitNotesCsv } from './parseFitNotesCsv.js'
import { isSqliteDatabase, validateFitNotesFile, validateSqliteDatabase } from './fitNotesValidation.js'
import { readFitNotesFileBytes } from './readFitNotesFileBytes.js'

export async function parseFitNotesFile(file) {
  validateFitNotesFile(file)

  const bytes = await readFitNotesFileBytes(file)
  const isBackup = String(file.name).toLowerCase().endsWith('.fitnotes')
  if (isBackup) validateSqliteDatabase(bytes)

  let parsed
  if (isSqliteDatabase(bytes)) {
    const { parseFitNotesDatabase } = await import('./parseFitNotesDatabase.js')
    parsed = await parseFitNotesDatabase(file, bytes)
  } else {
    parsed = parseFitNotesCsv(file, decodeText(bytes))
  }

  return { bytes, parsed }
}

function decodeText(bytes) {
  try {
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder('utf-16le', { fatal: true }).decode(bytes)
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder('utf-16be', { fatal: true }).decode(bytes)
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error('The selected file is not a supported FitNotes database or CSV.')
  }
}
