import { ref } from 'vue'
import { analyzeStoredBodyWeight } from '../services/bodyAiAnalysisService.js'

export function useBodyAiAnalysis() {
  const selectedGoal = ref('')
  const analysis = ref(null)
  const error = ref('')
  const loading = ref(false)

  function selectGoal(goal) {
    selectedGoal.value = goal
    error.value = ''
  }

  async function generateAnalysis() {
    if (!selectedGoal.value || loading.value) return

    loading.value = true
    error.value = ''

    try {
      analysis.value = await analyzeStoredBodyWeight(selectedGoal.value)
    } catch {
      analysis.value = null
      error.value = 'Body Weight data could not be analysed from local storage.'
    } finally {
      loading.value = false
    }
  }

  return {
    analysis,
    error,
    generateAnalysis,
    loading,
    selectedGoal,
    selectGoal,
  }
}
