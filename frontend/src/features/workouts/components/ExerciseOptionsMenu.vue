<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const open = ref(false)
const menu = ref(null)

onMounted(startListening)
onBeforeUnmount(stopListening)

function startListening() {
  document.addEventListener('pointerdown', closeFromOutside)
  document.addEventListener('keydown', closeWithEscape)
}

function stopListening() {
  document.removeEventListener('pointerdown', closeFromOutside)
  document.removeEventListener('keydown', closeWithEscape)
}

function toggle() {
  open.value = !open.value
}

function closeFromOutside(event) {
  if (!menu.value?.contains(event.target)) open.value = false
}

function closeWithEscape(event) {
  if (event.key === 'Escape') open.value = false
}
</script>

<template>
  <div ref="menu" class="exercise-options-menu">
    <button
      class="exercise-options-button"
      type="button"
      aria-label="Exercise options"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </svg>
    </button>

    <div v-if="open" class="exercise-options-popover" role="menu">
      <button type="button" role="menuitem" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
        <span>History</span>
      </button>
      <button type="button" role="menuitem" disabled>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
        <span>Records</span>
      </button>
      <button type="button" role="menuitem" disabled>
        <svg class="exercise-options-number" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <text x="12" y="16" text-anchor="middle">1</text>
        </svg>
        <span>1RM Calc</span>
      </button>
    </div>
  </div>
</template>
