<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'

let openModalCount = 0

const props = defineProps({
  open: { type: Boolean, required: true },
  ariaLabel: { type: String, required: true },
  layerClass: { type: String, default: '' },
  modalClass: { type: String, default: '' },
})

const emit = defineEmits(['close'])
let bodyLocked = false

watch(readOpenState, updateBodyState)

onMounted(mount)
onBeforeUnmount(unmount)

function readOpenState() {
  return props.open
}

function startListening() {
  window.addEventListener('keydown', handleKeyDown)
}

function mount() {
  startListening()
  updateBodyState(props.open)
}

function unmount() {
  window.removeEventListener('keydown', handleKeyDown)
  updateBodyState(false)
}

function updateBodyState(open) {
  if (open === bodyLocked) return
  bodyLocked = open
  openModalCount = Math.max(0, openModalCount + (open ? 1 : -1))
  document.body.classList.toggle('modal-open', openModalCount > 0)
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
