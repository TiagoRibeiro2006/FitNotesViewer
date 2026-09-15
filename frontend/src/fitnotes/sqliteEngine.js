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
    sqliteEnginePromise = initializeSqliteEngine()
  }

  return sqliteEnginePromise
}

async function initializeSqliteEngine() {
  try {
    return await initSqlJs(sqliteConfiguration)
  } catch (error) {
    sqliteEnginePromise = null
    throw error
  }
}

function locateSqliteFile() {
  return wasmUrl
}
