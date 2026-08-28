import { DB_NAME, DB_VERSION, STORE_DEFINITIONS } from './schema'

let databasePromise

export function openAppDatabase() {
  if (!databasePromise) databasePromise = createDatabaseConnection()
  return databasePromise
}

function createDatabaseConnection() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => configureStores(request)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'))
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another open app window.'))
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
