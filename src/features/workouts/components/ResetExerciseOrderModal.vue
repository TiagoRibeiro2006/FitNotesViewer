<script setup>
import ActionModal from '../../../shared/components/ActionModal.vue'

defineProps({ open: { type: Boolean, required: true } })
const emit = defineEmits(['cancel', 'reset'])

function cancel() {
  emit('cancel')
}

function reset() {
  emit('reset')
}
</script>

<template>
  <ActionModal
    :open="open"
    aria-label="Restore original exercise order"
    title="Restore original order?"
    layer-class="reset-exercise-order-layer"
    @close="cancel"
  >
    <p>This restores the order from when you opened Change Order.</p>
    <template #actions>
      <button class="action-modal-primary" type="button" @click="reset">Restore original order</button>
      <button class="reset-order-cancel" type="button" @click="cancel">Keep changes</button>
    </template>
  </ActionModal>
</template>

<style>
.modal-layer.reset-exercise-order-layer {
  z-index: 260;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.reset-order-cancel {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--theme-border-strong, #38383e);
  border-radius: var(--box-radius);
  background: var(--theme-surface-raised, #202024);
  color: var(--theme-text-primary, #fff);
  font-weight: 800;
  cursor: pointer;
}
</style>
