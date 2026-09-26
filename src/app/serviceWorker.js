const UPDATE_INTERVAL = 60 * 60 * 1000
const UPDATE_NOTICE_KEY = 'fitnotes-viewer-update-notice'
let registration
let reloadWhenUpdated = false
let updateReloadStarted = false

export function registerServiceWorker() {
  if (!canRegisterServiceWorker()) return
  window.addEventListener('load', register)
}

export function consumeAppUpdateNotice() {
  try {
    const storage = globalThis.sessionStorage
    if (!storage) return false
    const shouldShow = storage.getItem(UPDATE_NOTICE_KEY) === 'true'
    storage.removeItem(UPDATE_NOTICE_KEY)
    return shouldShow
  } catch {
    return false
  }
}

function canRegisterServiceWorker() {
  return 'serviceWorker' in navigator && import.meta.env.PROD
}

async function register() {
  try {
    reloadWhenUpdated = Boolean(navigator.serviceWorker.controller)
    navigator.serviceWorker.addEventListener('controllerchange', reloadForUpdate)
    registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })

    checkForUpdate()
    window.setInterval(checkForUpdate, UPDATE_INTERVAL)
    document.addEventListener('visibilitychange', checkWhenVisible)
  } catch {
    registration = null
  }
}

function reloadForUpdate() {
  if (!reloadWhenUpdated || updateReloadStarted) return

  updateReloadStarted = true
  markAppUpdated()
  window.location.reload()
}

function markAppUpdated() {
  try {
    globalThis.sessionStorage?.setItem(UPDATE_NOTICE_KEY, 'true')
  } catch {
    // Updating still succeeds when session storage is unavailable.
  }
}

function checkWhenVisible() {
  if (document.visibilityState === 'visible') checkForUpdate()
}

function checkForUpdate() {
  if (navigator.onLine && registration) void registration.update()
}
