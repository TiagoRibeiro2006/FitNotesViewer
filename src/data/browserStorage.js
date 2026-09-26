export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false

  try {
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) return null

  try {
    return await navigator.storage.estimate()
  } catch {
    return null
  }
}
