<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  ariaLabel: { type: String, required: true },
  layerClass: { type: String, default: '' },
  modalClass: { type: String, default: '' },
})

const emit = defineEmits(['close'])

watch(readOpenState, updateBodyState)

onMounted(startListening)
onBeforeUnmount(stopListening)

function readOpenState() {
  return props.open
}

function startListening() {
  window.addEventListener('keydown', handleKeyDown)
}

function stopListening() {
  window.removeEventListener('keydown', handleKeyDown)
  if (props.open) document.body.classList.remove('modal-open')
}

function updateBodyState(open) {
  document.body.classList.toggle('modal-open', open)
}

function handleKeyDown(event) {
  if (event.key === 'Escape' && props.open) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-layer" :class="layerClass" @click.self="emit('close')">
      <section class="workout-modal" :class="modalClass" role="dialog" aria-modal="true" :aria-label="ariaLabel">
        <slot />
      </section>
    </div>
  </Teleport>
</template>
