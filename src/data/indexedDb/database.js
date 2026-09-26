import { DB_NAME, DB_VERSION, STORE_DEFINITIONS } from './schema.js'

let databasePromise

export function openAppDatabase() {
  if (!databasePromise) {
    const connection = createDatabaseConnection(() => {
      if (databasePromise === connection) databasePromise = undefined
    })
    databasePromise = connection
    void connection.catch(() => {
      if (databasePromise === connection) databasePromise = undefined
    })
  }
  return databasePromise
}

function createDatabaseConnection(onClosed) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    let failed = false

    function fail(error) {
      failed = true
      reject(error)
    }

    request.onupgradeneeded = () => configureStores(request)
    request.onsuccess = () => {
      const database = request.result
      if (failed) {
        database.close()
        return
      }
      database.onversionchange = () => {
        database.close()
        onClosed()
      }
      database.onclose = onClosed
      resolve(database)
    }
    request.onerror = () => fail(request.error ?? new Error('IndexedDB could not be opened.'))
    request.onblocked = () => fail(new Error('Close other app windows, then try again to open your saved data.'))
  })
}

function configureStores(request) {
  const database = request.result

  for (const [name, definition] of Object.entries(STORE_DEFINITIONS)) {
    const store = database.objectStoreNames.contains(name)
      ? request.transaction.objectStore(name)
      : database.createObjectStore(name, { keyPath: definition.keyPath })

    for (const [indexName, keyPath] of definition.indexes ?? []) {
      if (!store.indexNames.contains(indexName)) store.createIndex(indexName, keyPath, { unique: false })
    }
  }
}
