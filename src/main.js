import { createApp } from 'vue'
import App from './App.vue'
import { registerServiceWorker } from './app/serviceWorker'
import './style.css'
import { initializeTheme } from './shared/composables/useTheme.js'

initializeTheme()
createApp(App).mount('#app')
registerServiceWorker()
