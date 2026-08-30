<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits(['select'])

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

function select(option) {
  emit('select', option)
  open.value = false
}

function closeFromOutside(event) {
  if (!menu.value?.contains(event.target)) open.value = false
}

function closeWithEscape(event) {
  if (event.key === 'Escape') open.value = false
}
</script>

<template>
  <div ref="menu" class="exercise-catalog-menu">
    <button
      class="exercise-catalog-menu-button"
      type="button"
      aria-label="Exercise management"
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

    <div v-if="open" class="exercise-catalog-popover" role="menu">
      <button type="button" role="menuitem" @click="select('muscles')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2.25" />
          <path d="M8.5 10.2c.9-1.7 2-2.7 3.5-2.7s2.6 1 3.5 2.7M9 10.5l-1 4.5m7-4.5 1 4.5M10.4 13.5 10 21m3.6-7.5.4 7.5" />
        </svg>
        <span>Muscle</span>
      </button>
      <button type="button" role="menuitem" @click="select('exercises')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="9.5" width="3" height="5" rx=".75" />
          <rect x="5.5" y="7.5" width="3" height="9" rx=".75" />
          <path d="M8.5 12h7" />
          <rect x="15.5" y="7.5" width="3" height="9" rx=".75" />
          <rect x="18.5" y="9.5" width="3" height="5" rx=".75" />
        </svg>
        <span>Exercise</span>
      </button>
    </div>
  </div>
</template>
