<script setup>
import ActionModal from '../../shared/components/ActionModal.vue'

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
  <ActionModal
    :open="open"
    aria-label="Import FitNotes data"
    eyebrow="WELCOME"
    title="Ever used FitNotes on iOS or Android?"
    @close="close"
  >
    <p class="empty-data-import-copy">
      Import your existing training data from a .fitnotes or .csv file.
    </p>
    <template #actions>
      <button class="action-modal-primary" type="button" @click="importData">
        Import data
      </button>
    </template>
  </ActionModal>
</template>

<style>
.empty-data-import-copy {
  margin: 0;
}
</style>
