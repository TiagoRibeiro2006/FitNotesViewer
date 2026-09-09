import { ref } from 'vue'
import { generateTrainingChatReply } from '../../../ai/chat/generateTrainingChatReply.js'

const sessionMessages = ref([])
let nextSessionMessageId = 1

export function useTrainingAiChat(trainingData) {
  const prompt = ref('')

  function sendPrompt() {
    const question = prompt.value.trim()
    if (!question) return false

    addSessionMessage('user', question)
    prompt.value = ''
    addSessionMessage('assistant', generateTrainingChatReply(question, trainingData?.sets))
    return true
  }

  return {
    messages: sessionMessages,
    prompt,
    sendPrompt,
  }
}

function addSessionMessage(role, text) {
  sessionMessages.value.push({
    id: nextSessionMessageId,
    role,
    text,
  })

  nextSessionMessageId += 1
}
