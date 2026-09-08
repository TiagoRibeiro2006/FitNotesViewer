import { computed, ref } from 'vue'
import { analyzeStoredBodyWeight } from '../services/bodyAiAnalysisService.js'

export function useBodyAiAnalysis(startDate, endDate) {
  const selectedGoal = ref('')
  const analysis = ref(null)
  const analyzedRequest = ref(null)
  const error = ref('')
  const loading = ref(false)
  const analysisIsCurrent = computed(checkAnalysisIsCurrent)

  function checkAnalysisIsCurrent() {
    const request = analyzedRequest.value
    return Boolean(
      analysis.value
      && request
      && request.goal === selectedGoal.value
      && request.startDate === startDate.value
      && request.endDate === endDate.value,
    )
  }

  function selectGoal(goal) {
    selectedGoal.value = goal
    error.value = ''
  }

  async function generateAnalysis() {
    if (!selectedGoal.value || loading.value || analysisIsCurrent.value) return

    loading.value = true
    error.value = ''

    try {
      const request = createAnalysisRequest()
      analysis.value = await analyzeStoredBodyWeight(
        request.goal,
        request.startDate,
        request.endDate,
      )
      analyzedRequest.value = request
    } catch {
      analysis.value = null
      analyzedRequest.value = null
      error.value = 'Body Weight data could not be analysed from local storage.'
    } finally {
      loading.value = false
    }
  }

  function createAnalysisRequest() {
    return {
      goal: selectedGoal.value,
      startDate: startDate.value,
      endDate: endDate.value,
    }
  }

  return {
    analysis,
    analysisIsCurrent,
    error,
    generateAnalysis,
    loading,
    selectedGoal,
    selectGoal,
  }
}
