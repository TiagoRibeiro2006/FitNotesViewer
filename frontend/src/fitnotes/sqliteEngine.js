import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const SQLITE_HEADER = 'SQLite format 3\u0000'
const MAX_FILE_SIZE = 25 * 1024 * 1024
let sqlJsPromise

export function warmUpSqliteEngine() {
  return getSqlJs()
}

export function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({ locateFile: () => wasmUrl })
  }

  return sqlJsPromise
}

export function validateFile(file) {
  if (!file) throw new Error('Select a .fitnotes file first.')
  if (!file.name.toLowerCase().endsWith('.fitnotes')) throw new Error('The file must use the .fitnotes extension.')
  if (file.size > MAX_FILE_SIZE) throw new Error('The file exceeds the 25 MB limit.')
}

export function validateSqlite(bytes) {
  if (bytes.length < 16) throw new Error('The file does not contain a valid SQLite database.')
  const header = new TextDecoder().decode(bytes.slice(0, 16))
  if (header !== SQLITE_HEADER) throw new Error('The file does not contain a valid SQLite database.')
}

