import { computed, ref } from 'vue'

export const TRAINING_CHAT_LOG_LIMIT = 10
export const TRAINING_CHAT_USER_MESSAGE_LIMIT = 20

const chats = ref([])
const activeChatId = ref('')
let nextChatId = 1
let nextMessageId = 1

const activeChat = computed(findActiveChat)
const activeMessages = computed(readActiveMessages)
const activeNotice = computed(readActiveNotice)
const chatSummaries = computed(buildChatSummaries)

createTrainingChat()

export function useTrainingChatSessionStore() {
  return {
    activeChat,
    activeChatId,
    activeMessages,
    activeNotice,
    chatSummaries,
  }
}

export function createTrainingChat(notice = '') {
  const timestamp = new Date().toISOString()
  const chat = {
    id: 'training-chat-' + nextChatId,
    createdAt: timestamp,
    updatedAt: timestamp,
    notice,
    messages: [],
  }

  nextChatId += 1
  chats.value.unshift(chat)
  activeChatId.value = chat.id
  removeOldChats()
  return chat.id
}

export function selectTrainingChat(chatId) {
  const chat = findChat(chatId)
  if (!chat) return false

  activeChatId.value = chat.id
  return true
}

export function addTrainingChatMessage(role, text) {
  const chat = findActiveChat()
  if (!chat) return null

  const message = {
    id: nextMessageId,
    role,
    text,
  }

  nextMessageId += 1
  chat.messages.push(message)
  chat.updatedAt = new Date().toISOString()
  return message
}

export function activeTrainingChatIsFull() {
  const chat = findActiveChat()
  if (!chat) return false

  let userMessageCount = 0
  for (const message of chat.messages) {
    if (message.role === 'user') userMessageCount += 1
  }
  return userMessageCount >= TRAINING_CHAT_USER_MESSAGE_LIMIT
}

function findActiveChat() {
  return findChat(activeChatId.value)
}

function findChat(chatId) {
  for (const chat of chats.value) {
    if (chat.id === chatId) return chat
  }
  return null
}

function readActiveMessages() {
  return activeChat.value?.messages ?? []
}

function readActiveNotice() {
  return activeChat.value?.notice ?? ''
}

function buildChatSummaries() {
  const summaries = []
  for (const chat of chats.value) {
    summaries.push({
      id: chat.id,
      title: readChatTitle(chat),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messageCount: chat.messages.length,
      userMessageCount: countUserMessages(chat),
    })
  }
  return summaries
}

function readChatTitle(chat) {
  for (const message of chat.messages) {
    if (message.role !== 'user') continue
    const title = String(message.text ?? '').trim()
    if (title.length <= 48) return title
    return title.slice(0, 45) + '…'
  }
  return 'New conversation'
}

function countUserMessages(chat) {
  let count = 0
  for (const message of chat.messages) {
    if (message.role === 'user') count += 1
  }
  return count
}

function removeOldChats() {
  while (chats.value.length > TRAINING_CHAT_LOG_LIMIT) chats.value.pop()
}
