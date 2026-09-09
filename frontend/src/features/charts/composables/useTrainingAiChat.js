import { ref } from 'vue'
import { generateTrainingChatReply } from '../../../ai/chat/generateTrainingChatReply.js'
import {
  activeTrainingChatIsFull,
  addTrainingChatMessage,
  createTrainingChat,
  useTrainingChatSessionStore,
} from '../../ai-chat/services/trainingChatSessionStore.js'

export function useTrainingAiChat(trainingData) {
  const prompt = ref('')
  const { activeMessages, activeNotice } = useTrainingChatSessionStore()

  function sendPrompt() {
    const question = prompt.value.trim()
    if (!question) return false

    startNewChatWhenFull()
    addTrainingChatMessage('user', question)
    prompt.value = ''
    addTrainingChatMessage('assistant', generateTrainingChatReply(question, trainingData?.sets))
    return true
  }

  return {
    messages: activeMessages,
    notice: activeNotice,
    prompt,
    sendPrompt,
  }
}

function startNewChatWhenFull() {
  if (!activeTrainingChatIsFull()) return
  createTrainingChat('A new chat was started because the previous conversation reached 20 messages.')
}
