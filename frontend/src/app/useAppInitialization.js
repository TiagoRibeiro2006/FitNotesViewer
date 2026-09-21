import { ref } from 'vue'
import { createEmptySummary } from '../shared/models/summary.js'
import { friendlyError } from '../shared/utils/errors.js'

export function useAppInitialization(loadSummary, startBackgroundServices) {
  const summary = ref(createEmptySummary())
  const appReady = ref(false)
  const initializationError = ref('')
  const initializing = ref(false)

  async function initializeApp() {
    if (initializing.value) return
    initializing.value = true
    initializationError.value = ''
    try {
      summary.value = await loadSummary()
      appReady.value = true
    } catch (error) {
      initializationError.value = friendlyError(error)
    } finally {
      initializing.value = false
    }
    if (appReady.value) startBackgroundServices()
  }

  return { summary, appReady, initializationError, initializing, initializeApp }
}
