<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  item: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save'])
const value = ref('')
const valueInput = ref(null)

const canSave = computed(() => {
  const text = String(value.value).trim()
  if (!text) return false
  const number = Number(text.replace(',', '.'))
  return Number.isFinite(number) && number >= 0
})

watch(() => props.open, async (open) => {
  if (!open) return
  value.value = ''
  await nextTick()
  valueInput.value?.focus()
})

function close() {
  if (!props.saving) emit('close')
}

function submit() {
  if (canSave.value && !props.saving) emit('save', value.value)
}
</script>

<template>
  <BaseModal
    :open="open"
    :aria-label="`Add ${item?.name ?? 'measurement'} value`"
    layer-class="body-value-layer"
    modal-class="body-value-modal"
    @close="close"
  >
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Close" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
      <div class="modal-heading">
        <p>New value</p>
        <h2>{{ item?.name }}</h2>
      </div>
      <span class="modal-header-spacer" aria-hidden="true"></span>
    </header>

    <form class="body-value-form" @submit.prevent="submit">
      <label for="body-value-input">Value</label>
      <div class="body-value-field">
        <input
          id="body-value-input"
          ref="valueInput"
          v-model="value"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0"
        />
        <span v-if="item?.unit">{{ item.unit }}</span>
      </div>

      <p v-if="error" class="editor-error body-value-error">{{ error }}</p>
      <button class="body-value-save" type="submit" :disabled="saving || !canSave">
        {{ saving ? 'Saving…' : 'Save value' }}
      </button>
    </form>
  </BaseModal>
</template>
