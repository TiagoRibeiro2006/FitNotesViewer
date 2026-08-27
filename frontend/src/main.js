import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      // Pick up a new Cloudflare deployment when the app is opened again.
      void registration.update()

      // Installed PWAs can stay open for a long time, so also check quietly
      // while the app remains active. The new worker activates automatically.
      window.setInterval(() => {
        if (navigator.onLine) void registration.update()
      }, 60 * 60 * 1000)

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          void registration.update()
        }
      })
    } catch {
      // The app remains usable online even if Service Worker registration fails.
    }
  })
}
