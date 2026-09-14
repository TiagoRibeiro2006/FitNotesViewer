import { parseFitNotesDatabase } from './parseFitNotesDatabase'
import { parseFitNotesCsv } from './parseFitNotesCsv'
import { isSqliteDatabase, validateFitNotesFile } from './fitNotesValidation'

export async function parseFitNotesFile(file) {
  validateFitNotesFile(file)

  const bytes = new Uint8Array(await file.arrayBuffer())
  const parsed = isSqliteDatabase(bytes)
    ? await parseFitNotesDatabase(file, bytes)
    : parseFitNotesCsv(file, decodeText(bytes))

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
