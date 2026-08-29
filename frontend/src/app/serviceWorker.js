const UPDATE_INTERVAL = 60 * 60 * 1000
let registration

export function registerServiceWorker() {
  if (!canRegisterServiceWorker()) return
  window.addEventListener('load', register)
}

function canRegisterServiceWorker() {
  return 'serviceWorker' in navigator && import.meta.env.PROD
}

async function register() {
  try {
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

function checkWhenVisible() {
  if (document.visibilityState === 'visible') checkForUpdate()
}

function checkForUpdate() {
  if (navigator.onLine && registration) void registration.update()
}
