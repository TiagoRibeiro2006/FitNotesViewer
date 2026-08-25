import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

const sqliteConfiguration = {
  locateFile: locateSqliteFile,
}

let sqliteEnginePromise

export function warmUpSqliteEngine() {
  return loadSqliteEngine()
}

export function loadSqliteEngine() {
  if (!sqliteEnginePromise) {
    sqliteEnginePromise = initSqlJs(sqliteConfiguration)
  }

  return sqliteEnginePromise
}

function locateSqliteFile() {
  return wasmUrl
}
