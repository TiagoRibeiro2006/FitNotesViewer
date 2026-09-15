<script setup>
import BaseModal from '../../shared/components/BaseModal.vue'

defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'import'])

function close() {
  emit('close')
}

function importData() {
  emit('import')
}
</script>

<template>
  <BaseModal
    :open="open"
    aria-label="Import FitNotes data"
    layer-class="empty-data-import-layer"
    modal-class="empty-data-import-modal"
    @close="close"
  >
    <button class="empty-data-import-close" type="button" aria-label="Close" @click="close">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button>

    <p class="eyebrow">WELCOME</p>
    <h2>Ever used FitNotes on iOS or Android?</h2>
    <p class="empty-data-import-copy">
      Import your existing training data from a .fitnotes or .csv file.
    </p>
    <button class="empty-data-import-button" type="button" @click="importData">
      Import data
    </button>
  </BaseModal>
</template>

<style>
.modal-layer.empty-data-import-layer {
  display: grid;
  place-items: center;
  padding: max(18px, env(safe-area-inset-top)) 18px max(18px, env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, .72);
}

.workout-modal.empty-data-import-modal {
  width: min(390px, 100%);
  height: auto;
  max-height: none;
  display: block;
  padding: 26px 22px 22px;
  overflow: visible;
  border: 1px solid #303030;
  border-radius: var(--box-radius);
  background: #101010;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .72);
}

.empty-data-import-modal h2 {
  max-width: 310px;
  margin: 0;
  color: #fff;
  font-size: 24px;
  line-height: 1.16;
  letter-spacing: -.025em;
}

.empty-data-import-copy {
  margin: 13px 0 21px;
  color: #9d9da5;
  font-size: 14px;
  line-height: 1.5;
}

.empty-data-import-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #85858d;
  cursor: pointer;
}

.empty-data-import-close svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.empty-data-import-button {
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: var(--box-radius);
  background: #f5f5f5;
  color: #080808;
  font-weight: 850;
  cursor: pointer;
}

.empty-data-import-button:active {
  transform: scale(.99);
}
</style>
