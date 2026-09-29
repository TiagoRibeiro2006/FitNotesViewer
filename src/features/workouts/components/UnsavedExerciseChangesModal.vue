<script setup>
import BaseModal from '../../../shared/components/BaseModal.vue'

defineProps({
  busy: { type: Boolean, default: false },
  canSave: { type: Boolean, default: false },
  error: { type: String, default: '' },
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['cancel', 'discard', 'save'])
</script>

<template>
  <BaseModal
    :open="open"
    aria-label="Unsaved exercise changes"
    layer-class="unsaved-changes-layer"
    modal-class="confirmation-modal unsaved-changes-modal"
    @close="emit('cancel')"
  >
    <div class="unsaved-changes-content">
      <p class="eyebrow">UNSAVED CHANGES</p>
      <h2>Leave this exercise?</h2>
      <p>Your changes have not been saved yet.</p>

      <p v-if="error" class="editor-error" role="alert">{{ error }}</p>

      <div class="unsaved-changes-actions">
        <button
          class="unsaved-changes-save"
          type="button"
          :disabled="busy || !canSave"
          @click="emit('save')"
        >
          {{ busy ? 'Saving…' : 'Save and exit' }}
        </button>
        <button
          class="unsaved-changes-discard"
          type="button"
          :disabled="busy"
          @click="emit('discard')"
        >
          Exit without saving
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style>
.modal-layer.unsaved-changes-layer {
  background: rgba(0, 0, 0, .58);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
</style>
