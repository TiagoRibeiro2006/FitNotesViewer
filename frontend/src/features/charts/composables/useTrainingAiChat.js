import { ref } from 'vue'
import { generateTrainingChatReply } from '../../../ai/chat/generateTrainingChatReply.js'

const sessionMessages = ref([])
const USER_MESSAGE_LIMIT = 20
let nextSessionMessageId = 1

export function useTrainingAiChat(trainingData) {
  const prompt = ref('')

  function sendPrompt() {
    const question = prompt.value.trim()
    if (!question) return false

    startNewSessionWhenFull()
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

function startNewSessionWhenFull() {
  if (countUserMessages() < USER_MESSAGE_LIMIT) return

  sessionMessages.value = []
  nextSessionMessageId = 1
}

function countUserMessages() {
  let count = 0
  for (const message of sessionMessages.value) {
    if (message.role === 'user') count += 1
  }
  return count
}

function addSessionMessage(role, text) {
  sessionMessages.value.push({
    id: nextSessionMessageId,
    role,
    text,
  })

  nextSessionMessageId += 1
}
