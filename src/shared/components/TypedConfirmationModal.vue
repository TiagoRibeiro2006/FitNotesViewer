<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  busy: { type: Boolean, default: false },
  confirmLabel: { type: String, required: true },
  danger: { type: Boolean, default: false },
  message: { type: String, required: true },
  open: { type: Boolean, required: true },
  title: { type: String, required: true },
})

const emit = defineEmits(['close', 'confirm'])
const confirmation = ref('')
const canConfirm = computed(readCanConfirm)

watch(readOpen, resetConfirmation)

function readOpen() {
  return props.open
}

function resetConfirmation() {
  confirmation.value = ''
}

function readCanConfirm() {
  return confirmation.value === 'CONFIRM'
}

function close() {
  if (!props.busy) emit('close')
}

function submit() {
  if (canConfirm.value && !props.busy) emit('confirm')
}
</script>

<template>
  <BaseModal :open="open" :aria-label="title" modal-class="confirmation-modal" @close="close">
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Close" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
      <div class="modal-heading">
        <h2>{{ title }}</h2>
      </div>
      <span class="modal-header-spacer"></span>
    </header>

    <form class="confirmation-form" @submit.prevent="submit">
      <p>{{ message }}</p>
      <label>
        <span>Type CONFIRM to continue</span>
        <input v-model="confirmation" type="text" autocomplete="off" spellcheck="false" />
      </label>
      <button
        class="confirmation-submit"
        :class="{ 'is-danger': danger }"
        type="submit"
        :disabled="busy || !canConfirm"
      >
        {{ busy ? 'Working…' : confirmLabel }}
      </button>
    </form>
  </BaseModal>
</template>
