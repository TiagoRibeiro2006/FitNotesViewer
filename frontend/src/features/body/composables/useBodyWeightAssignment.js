import { computed, ref } from 'vue'
import {
  getBodyWeightAssignmentState,
  saveBodyWeightAssignment,
} from '../../../data/repositories/bodyRepository.js'

export function useBodyWeightAssignment() {
  const bodyWeight = ref(null)
  const candidates = ref([])
  const loading = ref(true)
  const saving = ref(false)
  const error = ref('')
  const assigning = ref(false)
  const selectedId = ref('')
  const needsAssignment = computed(() => !loading.value && !bodyWeight.value)

  async function load() {
    loading.value = true
    error.value = ''

    try {
      applyState(await getBodyWeightAssignmentState())
    } catch {
      bodyWeight.value = null
      candidates.value = []
      error.value = 'Body Weight assignment could not be loaded.'
    } finally {
      loading.value = false
    }
  }

  function openAssignment() {
    selectedId.value = ''
    error.value = ''
    assigning.value = true
  }

  function closeAssignment() {
    assigning.value = false
    error.value = ''
  }

  function selectCandidate(id) {
    selectedId.value = String(id)
  }

  async function confirmAssignment() {
    if (!selectedId.value || saving.value) return false
    saving.value = true
    error.value = ''

    try {
      await saveBodyWeightAssignment(selectedId.value)
      applyState(await getBodyWeightAssignmentState())
      assigning.value = false
      return true
    } catch (assignmentError) {
      error.value = assignmentError instanceof Error
        ? assignmentError.message
        : 'Body Weight could not be assigned.'
      return false
    } finally {
      saving.value = false
    }
  }

  function applyState(state) {
    bodyWeight.value = state.bodyWeight
    candidates.value = state.candidates
    selectedId.value = state.assignedId ? String(state.assignedId) : ''
  }

  return {
    assigning,
    bodyWeight,
    candidates,
    closeAssignment,
    confirmAssignment,
    error,
    load,
    loading,
    needsAssignment,
    openAssignment,
    saving,
    selectCandidate,
    selectedId,
  }
}
