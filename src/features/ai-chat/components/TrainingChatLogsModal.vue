<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  chats: { type: Array, required: true },
  activeChatId: { type: String, required: true },
})

const emit = defineEmits(['close', 'create', 'select', 'delete'])

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const menuOpen = ref(false)
const deleteMode = ref(false)
const armedDeleteChatId = ref('')
const menu = ref(null)

onMounted(startListening)
onBeforeUnmount(stopListening)
watch(readOpen, handleOpenChange)

function startListening() {
  document.addEventListener('pointerdown', closeMenuFromOutside)
  document.addEventListener('keydown', closeWithEscape)
}

function stopListening() {
  document.removeEventListener('pointerdown', closeMenuFromOutside)
  document.removeEventListener('keydown', closeWithEscape)
}

function readOpen() {
  return props.open
}

function handleOpenChange(open) {
  if (open) return
  menuOpen.value = false
  deleteMode.value = false
  armedDeleteChatId.value = ''
}

function close() {
  emit('close')
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function createChat() {
  menuOpen.value = false
  emit('create')
}

function enableDeleteMode() {
  menuOpen.value = false
  deleteMode.value = true
  armedDeleteChatId.value = ''
}

function selectChat(chatId) {
  if (deleteMode.value) return
  emit('select', chatId)
}

function deleteChat(chatId) {
  if (armedDeleteChatId.value !== chatId) {
    armedDeleteChatId.value = chatId
    return
  }

  armedDeleteChatId.value = ''
  emit('delete', chatId)
}

function closeMenuFromOutside(event) {
  if (!menu.value?.contains(event.target)) menuOpen.value = false
}

function closeWithEscape(event) {
  if (event.key === 'Escape') menuOpen.value = false
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

      <div ref="menu" class="training-chat-menu">
        <button
          class="modal-icon-button training-chat-menu-button"
          type="button"
          aria-label="Chat log actions"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          @click="toggleMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>

        <div v-if="menuOpen" class="training-chat-menu-popover" role="menu">
          <button type="button" role="menuitem" @click="createChat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>New chat</span>
          </button>
          <button class="is-danger" type="button" role="menuitem" @click="enableDeleteMode">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
            </svg>
            <span>Delete chat</span>
          </button>
        </div>
      </div>
    </header>

    <div class="training-chat-logs-content">
      <p class="training-chat-logs-description">
        {{ deleteMode ? 'Tap a red bin twice to delete a conversation.' : 'Continue one of the latest 10 conversations or use the menu to start a new chat.' }}
      </p>

      <div class="training-chat-log-list">
        <div
          v-for="chat in chats"
          :key="chat.id"
          class="training-chat-log-row"
          :class="{ 'is-active': chat.id === activeChatId }"
        >
          <button
            v-if="deleteMode"
            class="training-chat-delete-button"
            :class="{ 'is-armed': armedDeleteChatId === chat.id }"
            type="button"
            :aria-label="armedDeleteChatId === chat.id ? 'Confirm delete chat' : 'Delete chat'"
            @click="deleteChat(chat.id)"
          >
            <svg v-if="armedDeleteChatId !== chat.id" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 4 4L19 6" />
            </svg>
          </button>

          <button class="training-chat-log-main" type="button" :disabled="deleteMode" @click="selectChat(chat.id)">
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
    </div>
  </BaseModal>
</template>

<style>
.training-chat-logs-modal {
  width: min(520px, 100%);
}

.training-chat-menu {
  position: relative;
}

.training-chat-menu-button svg {
  fill: currentColor;
  stroke: none;
}

.training-chat-menu-popover {
  width: 190px;
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  overflow: hidden;
  padding: 6px;
  border: 1px solid #303030;
  border-radius: var(--box-radius);
  background: #171717;
  box-shadow: 0 18px 48px rgba(0, 0, 0, .58);
}

.training-chat-menu-popover button {
  width: 100%;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: #fff;
  text-align: left;
  cursor: pointer;
}

.training-chat-menu-popover button:active {
  background: #202020;
}

.training-chat-menu-popover button + button {
  border-top: 1px solid #292929;
  border-radius: 0;
}

.training-chat-menu-popover button.is-danger {
  color: #ff5f65;
}

.training-chat-menu-popover svg {
  width: 21px;
  height: 21px;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
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
  align-items: stretch;
  overflow: hidden;
  border: 1px solid #29292f;
  border-radius: var(--box-radius);
  background: #141416;
}

.training-chat-log-row.is-active {
  border-color: #315f91;
  background: #142238;
}

.training-chat-log-main {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px;
  border: 0;
  background: transparent;
  color: #f3f3f5;
  text-align: left;
  cursor: pointer;
}

.training-chat-log-main:disabled {
  cursor: default;
}

.training-chat-delete-button {
  width: 46px;
  flex: 0 0 46px;
  display: grid;
  place-items: center;
  border: 0;
  border-right: 1px solid #3b2528;
  background: #211416;
  color: #ff5f65;
  cursor: pointer;
}

.training-chat-delete-button.is-armed {
  background: #4a171b;
  color: #fff;
}

.training-chat-delete-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
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
