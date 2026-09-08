import { readonly, ref } from 'vue'

const aiEnabled = ref(false)

export function useAiMode() {
  function toggleAi() {
    aiEnabled.value = !aiEnabled.value
  }

  return {
    aiEnabled: readonly(aiEnabled),
    toggleAi,
  }
}
