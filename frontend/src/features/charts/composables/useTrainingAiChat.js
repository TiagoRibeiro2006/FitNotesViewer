import { ref } from 'vue'

const PLACEHOLDER_REPLY = 'This is not in my scope yet.'

export function useTrainingAiChat() {
  const prompt = ref('')
  const messages = ref([])
  let nextMessageId = 1

  function sendPrompt() {
    const question = prompt.value.trim()
    if (!question) return false

    addMessage('user', question)
    prompt.value = ''
    addMessage('assistant', PLACEHOLDER_REPLY)
    return true
  }

  function addMessage(role, text) {
    messages.value.push({
      id: nextMessageId,
      role,
      text,
    })

    nextMessageId += 1
  }

  return {
    messages,
    prompt,
    sendPrompt,
  }
}
