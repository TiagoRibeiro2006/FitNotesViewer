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
  z-index: 260;
  padding: max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, .58);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.workout-modal.unsaved-changes-modal {
  width: min(410px, 100%);
  height: auto;
  max-height: calc(100dvh - 40px);
  display: block;
  padding: 24px;
  overflow-y: auto;
  border-color: #333338;
  background: #111113;
  box-shadow: 0 28px 80px rgba(0, 0, 0, .72);
}

.unsaved-changes-content .eyebrow {
  margin-bottom: 9px;
  color: #e0b957;
}

.unsaved-changes-content h2 {
  margin: 0;
  color: #fff;
  font-size: 25px;
  line-height: 1.15;
  letter-spacing: -.025em;
}

.unsaved-changes-content > p:not(.eyebrow, .editor-error) {
  margin: 11px 0 0;
  color: #96969f;
  font-size: 14px;
  line-height: 1.5;
}

.unsaved-changes-content .editor-error {
  margin: 16px 0 0;
}

.unsaved-changes-actions {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.unsaved-changes-actions button {
  width: 100%;
  min-height: 49px;
  padding: 0 16px;
  border-radius: var(--box-radius);
  font-weight: 850;
  cursor: pointer;
}

.unsaved-changes-actions button:focus-visible {
  outline: 2px solid #62adff;
  outline-offset: 2px;
}

.unsaved-changes-actions button:active:not(:disabled) {
  transform: scale(.99);
}

.unsaved-changes-actions button:disabled {
  cursor: default;
  opacity: .4;
}

.unsaved-changes-save {
  border: 0;
  background: #f4f4f5;
  color: #09090b;
}

.unsaved-changes-discard {
  border: 1px solid #54302f;
  background: #241414;
  color: #ff8b84;
}

@media (max-width: 390px) {
  .workout-modal.unsaved-changes-modal {
    padding: 21px 18px 18px;
  }

  .unsaved-changes-content h2 {
    font-size: 23px;
  }
}
</style>
