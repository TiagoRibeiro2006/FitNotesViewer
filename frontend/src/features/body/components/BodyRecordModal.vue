<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'
import { formatBodyEntryDate } from '../bodyFormatters'

const props = defineProps({
  open: { type: Boolean, required: true },
  item: { type: Object, required: true },
  record: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save', 'delete'])
const value = ref('')
const deleteConfirming = ref(false)

const canSave = computed(() => {
  const text = String(value.value).trim()
  if (!text) return false
  const number = Number(text.replace(',', '.'))
  return Number.isFinite(number) && number >= 0
})

watch(() => [props.open, props.record], resetForm)

function resetForm() {
  value.value = props.record?.value ?? ''
  deleteConfirming.value = false
}

function close() {
  if (!props.saving) emit('close')
}

function submit() {
  if (canSave.value && !props.saving) emit('save', value.value)
}

function requestDelete() {
  if (props.saving) return
  if (!deleteConfirming.value) {
    deleteConfirming.value = true
    return
  }
  emit('delete')
}
</script>

<template>
  <BaseModal
    :open="open"
    :aria-label="`Edit ${item.name} value`"
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
        <p>{{ record ? formatBodyEntryDate(record) : '' }}</p>
        <h2>{{ item.name }}</h2>
      </div>
      <span class="modal-header-spacer" aria-hidden="true"></span>
    </header>

    <form class="body-value-form" @submit.prevent="submit">
      <label for="body-record-value">Value</label>
      <div class="body-value-field">
        <input
          id="body-record-value"
          v-model="value"
          type="text"
          inputmode="decimal"
          autocomplete="off"
        />
        <span v-if="item.unit">{{ item.unit }}</span>
      </div>

      <p v-if="error" class="editor-error body-value-error">{{ error }}</p>
      <div class="body-record-actions">
        <button class="body-record-delete" type="button" :disabled="saving" @click="requestDelete">
          {{ deleteConfirming ? 'Tap again to delete' : 'Delete' }}
        </button>
        <button class="body-value-save" type="submit" :disabled="saving || !canSave">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
