import { requestResult, transactionComplete } from '../indexedDb/transactions.js'

// Separate from imported data: replacing a backup must not erase the folder permission.
export async function openBackupPreferences() {
  const request = indexedDB.open('fitnotes-backup-preferences', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('preferences')
  return requestResult(request)
}

export async function readBackupPreferences() {
  const database = await openBackupPreferences()
  try {
    const transaction = database.transaction('preferences', 'readonly')
    const done = transactionComplete(transaction)
    const value = await requestResult(transaction.objectStore('preferences').get('automatic'))
    await done
    return { enabled: false, intervalDays: 7, keepLatestOnly: false, lastBackupAt: null, files: [], ...value }
  } finally {
    database.close()
  }
}

export async function updateBackupPreferences(changes) {
  const database = await openBackupPreferences()
  try {
    const transaction = database.transaction('preferences', 'readwrite')
    const done = transactionComplete(transaction)
    const store = transaction.objectStore('preferences')
    const value = await requestResult(store.get('automatic'))
    store.put({ ...value, ...changes }, 'automatic')
    await done
  } finally {
    database.close()
  }
}
