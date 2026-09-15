<script setup>
import ActionModal from '../../../shared/components/ActionModal.vue'

defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>

<template>
  <ActionModal
    :open="open"
    aria-label="Export FitNotes data"
    eyebrow="DATA EXPORT"
    title="Choose an export format"
    modal-class="export-data-modal"
    @close="close"
  >
    <p>Save a copy of your training data to your device.</p>

    <template #actions>
      <button class="export-format-button" type="button" disabled>
        <span>
          <strong>FitNotes backup</strong>
          <small>For restoring data in FitNotes</small>
        </span>
        <b>.fitnotes</b>
      </button>

      <button class="export-format-button" type="button" disabled>
        <span>
          <strong>Spreadsheet data</strong>
          <small>For Excel, Sheets or another app</small>
        </span>
        <b>.csv</b>
      </button>
    </template>
  </ActionModal>
</template>

<style>
.export-data-modal .action-modal-actions {
  gap: 12px;
}

.export-format-button {
  width: 100%;
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 14px;
  border: 1px solid #303036;
  border-radius: var(--box-radius);
  background: #17171a;
  color: #fff;
  text-align: left;
}

.export-format-button span {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.export-format-button strong {
  font-size: 15px;
}

.export-format-button small {
  overflow: hidden;
  color: #8f8f98;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-format-button b {
  flex: 0 0 auto;
  padding: 5px 8px;
  border-radius: 7px;
  background: #242429;
  color: #8f8f98;
  font-size: 11px;
  letter-spacing: .04em;
}

.export-format-button:disabled {
  opacity: .55;
}
</style>
