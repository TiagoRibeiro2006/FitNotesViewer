import { ref } from 'vue'
import { generateTrainingChatReply } from '../../../ai/chat/generateTrainingChatReply.js'

export function useTrainingAiChat(trainingData) {
  const prompt = ref('')
  const messages = ref([])
  let nextMessageId = 1

  function sendPrompt() {
    const question = prompt.value.trim()
    if (!question) return false

    addMessage('user', question)
    prompt.value = ''
    addMessage('assistant', generateTrainingChatReply(question, trainingData?.sets))
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
