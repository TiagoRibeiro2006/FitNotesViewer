<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  deleting: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  label: { type: String, required: true },
  warning: { type: String, default: '' },
})

const emit = defineEmits(['delete'])
const confirming = ref(false)

watch(readDisabled, resetConfirmation)

function readDisabled() {
  return props.disabled
}

function resetConfirmation() {
  confirming.value = false
}

function requestDelete() {
  if (props.disabled || props.deleting) return
  if (!confirming.value) {
    confirming.value = true
    return
  }
  confirming.value = false
  emit('delete')
}
</script>

<template>
  <div class="catalog-delete-action">
    <button
      class="delete-exercise-button"
      type="button"
      :class="{ 'is-confirming': confirming }"
      :disabled="disabled || deleting"
      @click="requestDelete"
    >
      {{ deleting ? 'Deleting…' : confirming ? 'Tap again to delete' : label }}
    </button>
    <small v-if="warning">{{ warning }}</small>
  </div>
</template>
