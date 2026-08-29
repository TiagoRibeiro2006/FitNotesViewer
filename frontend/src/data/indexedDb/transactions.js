export function putMany(store, rows = []) {
  for (const row of rows) store.put(row)
}

export function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
  })
}

export function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'))
  })
}

export function markLocalChanges(transaction, updatedAt = new Date().toISOString()) {
  transaction.objectStore('metadata').put({ key: 'hasLocalChanges', value: true })
  transaction.objectStore('metadata').put({ key: 'lastLocalChangeAt', value: updatedAt })
}
