const UPDATE_INTERVAL = 60 * 60 * 1000
let registration
let reloadWhenUpdated = false
let updateReloadStarted = false

export function registerServiceWorker() {
  if (!canRegisterServiceWorker()) return
  window.addEventListener('load', register)
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
  window.location.reload()
}

function checkWhenVisible() {
  if (document.visibilityState === 'visible') checkForUpdate()
}

function checkForUpdate() {
  if (navigator.onLine && registration) void registration.update()
}
