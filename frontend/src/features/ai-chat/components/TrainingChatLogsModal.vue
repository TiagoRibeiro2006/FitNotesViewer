<script setup>
import BaseModal from '../../../shared/components/BaseModal.vue'

defineProps({
  open: { type: Boolean, required: true },
  chats: { type: Array, required: true },
  activeChatId: { type: String, required: true },
})

const emit = defineEmits(['close', 'create', 'select'])

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function close() {
  emit('close')
}

function createChat() {
  emit('create')
}

function selectChat(chatId) {
  emit('select', chatId)
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return dateFormatter.format(date)
}

function messageLabel(count) {
  return count === 1 ? '1 message sent' : count + ' messages sent'
}
</script>

<template>
  <BaseModal
    :open="open"
    aria-label="Training AI conversations"
    modal-class="training-chat-logs-modal"
    @close="close"
  >
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Close" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>

      <div class="modal-heading">
        <p>TRAINING AI</p>
        <h2>Chat logs</h2>
      </div>

      <button class="modal-icon-button training-chat-new-button" type="button" aria-label="New chat" @click="createChat">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </header>

    <div class="training-chat-logs-content">
      <p class="training-chat-logs-description">
        Continue one of the latest 10 conversations or use + to start a new chat.
      </p>

      <div class="training-chat-log-list">
        <button
          v-for="chat in chats"
          :key="chat.id"
          class="training-chat-log-row"
          :class="{ 'is-active': chat.id === activeChatId }"
          type="button"
          @click="selectChat(chat.id)"
        >
          <span class="training-chat-log-copy">
            <strong>{{ chat.title }}</strong>
            <small>{{ formatDate(chat.updatedAt) }} · {{ messageLabel(chat.userMessageCount) }}</small>
          </span>
          <span class="training-chat-log-action">
            {{ chat.id === activeChatId ? 'Active' : 'Open' }}
          </span>
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style>
.training-chat-logs-modal {
  width: min(520px, 100%);
}

.training-chat-new-button {
  color: #62adff;
}

.training-chat-logs-content {
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
}

.training-chat-logs-description {
  margin: 0 0 14px;
  color: #85858e;
  font-size: 12px;
  line-height: 1.5;
}

.training-chat-log-list {
  display: grid;
  gap: 8px;
}

.training-chat-log-row {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px;
  border: 1px solid #29292f;
  border-radius: var(--box-radius);
  background: #141416;
  color: #f3f3f5;
  text-align: left;
  cursor: pointer;
}

.training-chat-log-row.is-active {
  border-color: #315f91;
  background: #142238;
}

.training-chat-log-copy {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.training-chat-log-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.training-chat-log-copy small {
  color: #777780;
  font-size: 10px;
}

.training-chat-log-action {
  flex: 0 0 auto;
  color: #62adff;
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
}
</style>
