<script setup>
import { nextTick, ref } from 'vue'
import { useTrainingAiChat } from '../composables/useTrainingAiChat.js'

const props = defineProps({
  sets: { type: Array, required: true },
})

const { messages, prompt, sendPrompt } = useTrainingAiChat(props)
const chatMessages = ref(null)

async function submitPrompt() {
  const messageSent = sendPrompt()
  if (!messageSent) return

  await nextTick()
  scrollToLatestMessage()
}

function scrollToLatestMessage() {
  if (!chatMessages.value) return
  chatMessages.value.scrollTop = chatMessages.value.scrollHeight
}
</script>

<template>
  <section class="chart-visual-card training-ai-chat-card">
    <div class="chart-card-heading training-ai-chat-heading">
      <div>
        <p class="eyebrow">AI TRAINING CHAT</p>
        <h2>Ask about your training</h2>
      </div>
      <span class="training-ai-chat-status">Local test</span>
    </div>

    <div ref="chatMessages" class="training-ai-chat-messages" aria-live="polite">
      <div v-if="!messages.length" class="training-ai-chat-empty">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4.5 3v-3H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
          <path d="M8 10h8M8 13h5" />
        </svg>
        <strong>Start a conversation</strong>
        <p>Ask about your sets, workout count, top muscle, top exercise, volume, or training summary.</p>
      </div>

      <div
        v-for="message in messages"
        :key="message.id"
        class="training-ai-chat-message"
        :class="`is-${message.role}`"
      >
        <span>{{ message.role === 'user' ? 'You' : 'AI' }}</span>
        <p>{{ message.text }}</p>
      </div>
    </div>

    <form class="training-ai-chat-form" @submit.prevent="submitPrompt">
      <label for="training-ai-prompt">Your question</label>
      <div class="training-ai-chat-input-row">
        <textarea
          id="training-ai-prompt"
          v-model="prompt"
          rows="1"
          placeholder="Ask something about your training…"
          maxlength="500"
        ></textarea>
        <button type="submit" :disabled="!prompt.trim()" aria-label="Send question">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 4 16 8-16 8 3-8-3-8Z" />
            <path d="M7 12h13" />
          </svg>
        </button>
      </div>
    </form>
  </section>
</template>
