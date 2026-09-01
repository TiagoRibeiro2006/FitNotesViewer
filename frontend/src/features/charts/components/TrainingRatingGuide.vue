<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const RATINGS = [
  { level: 'terrible', label: 'Terrible' },
  { level: 'bad', label: 'Bad' },
  { level: 'average', label: 'Average' },
  { level: 'great', label: 'Great' },
]

defineProps({
  level: { type: String, required: true },
  label: { type: String, required: true },
})

const open = ref(false)
const guideElement = ref(null)

onMounted(addPageListeners)
onBeforeUnmount(removePageListeners)

function toggleGuide() {
  open.value = !open.value
}

function closeGuide() {
  open.value = false
}

function closeFromPage(event) {
  if (!open.value || guideElement.value?.contains(event.target)) return
  closeGuide()
}

function closeFromKeyboard(event) {
  if (event.key === 'Escape') closeGuide()
}

function addPageListeners() {
  document.addEventListener('pointerdown', closeFromPage)
  document.addEventListener('keydown', closeFromKeyboard)
}

function removePageListeners() {
  document.removeEventListener('pointerdown', closeFromPage)
  document.removeEventListener('keydown', closeFromKeyboard)
}
</script>

<template>
  <div ref="guideElement" class="training-rating-guide">
    <button
      class="training-analysis-badge"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="toggleGuide"
    >
      {{ label }}
    </button>

    <div v-if="open" class="training-rating-popover" role="dialog" aria-label="Training rating guide">
      <div class="training-rating-labels">
        <span
          v-for="rating in RATINGS"
          :key="rating.level"
          :class="['is-' + rating.level, { 'is-current': rating.level === level }]"
        >
          {{ rating.label }}
        </span>
      </div>
      <div class="training-rating-spectrum" aria-hidden="true"></div>
      <small>Training quality from lowest to highest</small>
    </div>
  </div>
</template>
