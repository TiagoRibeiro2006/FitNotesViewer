<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  ariaLabel: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  layerClass: { type: String, default: '' },
  modalClass: { type: String, default: '' },
  open: { type: Boolean, required: true },
  title: { type: String, required: true },
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    :aria-label="ariaLabel"
    :layer-class="'action-modal-layer ' + layerClass"
    :modal-class="'action-modal ' + modalClass"
    @close="close"
  >
    <button class="modal-icon-button action-modal-close" type="button" aria-label="Close" @click="close">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button>

    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
    <h2>{{ title }}</h2>
    <div class="action-modal-content">
      <slot />
    </div>
    <div class="action-modal-actions">
      <slot name="actions" />
    </div>
  </BaseModal>
</template>

<style>
.modal-layer.action-modal-layer {
  display: grid;
  place-items: center;
  padding: max(18px, env(safe-area-inset-top)) 18px max(18px, env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, .72);
}

.workout-modal.action-modal {
  width: min(390px, 100%);
  height: auto;
  max-height: calc(100dvh - 36px);
  display: block;
  padding: 26px 22px 22px;
  overflow-y: auto;
  border: 1px solid #303030;
  border-radius: var(--box-radius);
  background: #101010;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .72);
}

.action-modal h2 {
  max-width: 310px;
  margin: 0;
  color: #fff;
  font-size: 24px;
  line-height: 1.16;
  letter-spacing: -.025em;
}

.action-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
}

.action-modal-content {
  margin-top: 13px;
  color: #9d9da5;
  font-size: 14px;
  line-height: 1.5;
}

.action-modal-content > :first-child,
.action-modal-actions > :first-child {
  margin-top: 0;
}

.action-modal-content > :last-child,
.action-modal-actions > :last-child {
  margin-bottom: 0;
}

.action-modal-actions {
  display: grid;
  gap: 10px;
  margin-top: 21px;
}

.action-modal-primary {
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: var(--box-radius);
  background: #f5f5f5;
  color: #080808;
  font-weight: 850;
  cursor: pointer;
}

.action-modal-primary:active {
  transform: scale(.99);
}

.action-modal-primary:disabled {
  opacity: .45;
  cursor: default;
}
</style>
