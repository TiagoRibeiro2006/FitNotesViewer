const SQLITE_HEADER = 'SQLite format 3\u0000'
const MAX_FILE_SIZE = 25 * 1024 * 1024
const SUPPORTED_EXTENSIONS = ['.fitnotes', '.csv']

export function validateFitNotesFile(file) {
  if (!file) throw new Error('Select a .fitnotes or .csv file first.')
  if (!hasSupportedExtension(file.name)) {
    throw new Error('The file must use the .fitnotes or .csv extension.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('The file exceeds the 25 MB limit.')
  }
}

export function validateSqliteDatabase(bytes) {
  if (!isSqliteDatabase(bytes)) {
    throw new Error('The file does not contain a valid SQLite database.')
  }
}

export function isSqliteDatabase(bytes) {
  if (bytes.length < 16) return false
  const header = new TextDecoder().decode(bytes.slice(0, 16))
  return header === SQLITE_HEADER
}

function hasSupportedExtension(fileName) {
  const name = String(fileName ?? '').toLowerCase()
  for (const extension of SUPPORTED_EXTENSIONS) {
    if (name.endsWith(extension)) return true
  }
  return false
}
