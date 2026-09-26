import { createApp } from 'vue'
import App from './App.vue'
import { registerServiceWorker } from './app/serviceWorker'
import './style.css'

createApp(App).mount('#app')
registerServiceWorker()
