<script setup>
import { computed } from 'vue'
import { resolveMuscleIcon } from '../../../shared/models/muscleIcons.js'

const props = defineProps({
  name: { type: String, default: '' },
  iconId: { type: String, default: undefined },
})
const icon = computed(readIcon)

function readIcon() {
  return resolveMuscleIcon(props.name, props.iconId)
}
</script>

<template>
  <svg v-if="icon === 'abs'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 2H6C3 2 2 3 2 5c0 3 1 5 4 5h4c1 0 1.5-.5 1.5-1.5v-5C11.5 2.5 11 2 10 2Zm4 0h4c3 0 4 1 4 3 0 3-1 5-4 5h-4c-1 0-1.5-.5-1.5-1.5v-5C12.5 2.5 13 2 14 2ZM10 11H6c-2 0-3 1-2.5 3 .5 2.5 1.5 3 4 3H10c1 0 1.5-.5 1.5-1.5v-3C11.5 11.5 11 11 10 11Zm4 0h4c2 0 3 1 2.5 3-.5 2.5-1.5 3-4 3H14c-1 0-1.5-.5-1.5-1.5v-3c0-1 .5-1.5 1.5-1.5Zm-4 7H7c-2 0-2.5 1-1 2.5C7.5 22 9 23 10 23s1.5-.5 1.5-1.5v-2C11.5 18.5 11 18 10 18Zm4 0h3c2 0 2.5 1 1 2.5C16.5 22 15 23 14 23s-1.5-.5-1.5-1.5v-2c0-1 .5-1.5 1.5-1.5Z" />
  </svg>
  <svg v-else-if="icon === 'lats'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 22c1.8-3.8 2.1-7 .1-10.4C2.8 8 4.5 5.9 9 4.7c5-1.3 9.1-2.4 12-4.2.9 3.4-2.3 5.4-9 7.8 3.7-.5 6.6-1.4 9-2.7-.1 3.5-3.5 5.1-9.1 6.3 2.8 0 5.2-.4 7.1-1.1-.7 3-3.3 4.1-7.6 4.6 1.9.2 3.5.1 4.8-.2-1 2.6-3.1 3.4-6.2 3.5 1.1.3 2.2.4 3.1.3-1.5 2.1-4.1 2.9-8.1 3Z" />
  </svg>
  <svg v-else-if="icon === 'glutes'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5c.3-3.1 2.5-4.3 6-3.9C17.4 4 15.4 5.4 12 5ZM11.3 6.6C7.2 3.4 2.3 5.6 2.3 10.8c0 5 4.4 10.4 8.7 11.1.5-1.1.8-2.8.8-4.5 0-3.8-1.1-7-2.5-8.9 2.4 1.3 3.9 5.2 3.9 9 0 1.8-.3 3.3-.7 4.5 4.5-.5 9.2-6 9.2-11.2 0-5.2-5.2-7.6-9.1-4.2-.3.3-1 .3-1.3 0Z" />
  </svg>
  <svg v-else-if="icon === 'biceps'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.4 18.7c-.5-1.6-.2-3.2.4-5L6 7c.3-.9.6-1.7 1.2-2.4l2.4-2.8c.4-.5.9-.7 1.5-.6l2.3.5c.7.2.9.7 1 1.4l.3 1.1c.3.7 0 1.3-.7 1.6l-1.1.4c-.8 1.1-2.2 1.5-3.6 1.2-.8 2.3-.5 4.2.1 6.4 1.1-2.1 2.6-4.3 4.5-4.3 2 0 3.1 1.8 4.3 3.2 1.6 0 2.5.4 3.2 1.3 1 1.4.8 3.5-.1 5.4-.3.7-.9 1-1.6.8l-2.4-1c-4.2 1.6-8.9 1.2-13-.3-.5-.2-.8-.7-.9-1.2Z" />
  </svg>
  <svg v-else-if="icon === 'side-delts'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill-rule="evenodd" d="M9 1c1.6 1.3 2.4 2.8 2.7 4.7C12.6 3.5 14 2.5 16 2c-1.3 1.7-1.7 3.5-1.5 5.2C15 9.4 21 11.2 21 16c0 4.2-4 6.5-9 6.5S3 20.2 3 16c0-4.8 6-6.6 6.5-8.8C10 5.2 9.6 3.1 9 1Zm1.2 8.8C7 12 5.5 15 6.6 18c.5 1.3 1.5 2.2 2.8 2.8C6.8 17 8.6 12.7 10.2 9.8Zm3.6 0c1.6 2.9 3.4 7.2.8 11 1.3-.6 2.3-1.5 2.8-2.8 1.1-3-.4-6-3.6-8.2Z" />
  </svg>
  <svg v-else-if="icon === 'chest'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4c1-2.6 3.8-3.3 7-2.5C17.6 4.2 15 5 12 4Z" />
    <path d="M12 3c.1 5.4-4.7 6-5 11M12 3c-.2 5.2 5 6.4 5 11" fill="none" stroke="var(--category-color, #7c7c85)" stroke-width="1.6" stroke-linecap="round" />
    <path d="M7 12c-3.1-1.2-5 .7-5 3.6C2 19 4.5 22 7 22s5-3 5-6.4c0-2.9-1.9-4.8-5-3.6Zm10 0c-2.4-.9-4.2.1-4.7 2.1.8 2.3.3 4.7-.7 6.4 1.3 1.4 3 2.3 4.4 2.3 3 0 6-3.5 6-7.2 0-2.9-1.9-4.8-5-3.6Z" />
  </svg>
  <svg v-else-if="icon === 'adductors'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill-rule="evenodd" d="M12 1.5C6 1.5 2.5 5 2.5 10.2c0 3.3 1.3 5 4 5.8v3.3c0 1 .7 1.7 1.7 1.7h1.1v-3h1.5v3h2.4v-3h1.5v3h1.1c1 0 1.7-.7 1.7-1.7V16c2.7-.8 4-2.5 4-5.8C21.5 5 18 1.5 12 1.5ZM8 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm8 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm-4 4.5-1.7 3h3.4L12 12.5Z" />
  </svg>
  <svg v-else-if="icon === 'triceps'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 1 3 5h-2v7c2.6-.4 4-1.8 4-4V7h-2l3-5 3 5h-2v2c0 3.4-2.2 5.6-6 6v7h-2v-7c-3.8-.4-6-2.6-6-6V7H3l3-5 3 5H7v2c0 2.2 1.4 3.6 4 4V6H9l3-5Z" />
  </svg>
  <svg v-else-if="icon === 'front-delts'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path class="muscle-icon-outline" d="M12 2 20 5v6c0 4.7-3.4 8.2-8 10.5C7.4 19.2 4 15.7 4 11V5l8-3Z" />
    <path d="m12 8 2.5 3.5L12 15l-2.5-3.5L12 8Z" />
  </svg>
  <svg v-else-if="icon === 'rear-delts'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path class="muscle-icon-outline" d="M10 2c0 4.2 5.8 4.7 5.8 8.7 0 3.5 3 5.3 3.2 9.3M10 2 5 15l14 5M3 17 20 7m-1 0 3-1-1.5 3M4 16l-2-.5.5 2L4 19l.5-2" />
  </svg>
  <svg v-else-if="icon === 'traps'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill-rule="evenodd" d="m1 20 8-13 5 7 3-4 6 10H1Zm5.6-6 2.4-4 2.6 4-2-1-1 1-1-1-1 1Zm9.1 1 1.3-2 1.4 2-1.1-.5-.5.7-.5-.7-.6.5Z" />
  </svg>
  <svg v-else-if="icon === 'hamstrings'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17 1 4 14h6L6 23l14-14h-6l3-8Z" />
  </svg>
  <svg v-else-if="icon === 'calfs'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 3C5.3 6 1.5 10.8 1.5 14.5a5 5 0 0 0 10 0C11.5 10.8 7.7 6 6.5 3Zm11 0c-1.2 3-5 7.8-5 11.5a5 5 0 0 0 10 0c0-3.7-3.8-8.5-5-11.5Z" />
  </svg>
  <svg v-else-if="icon === 'quads'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill-rule="evenodd" d="M6 5c0-2 2.7-3 6-3s6 1 6 3l-.7 10c0 2.6 1.7 4.3 3.7 5v2h-6l-3-2-3 2H3v-2c2-.7 3.7-2.4 3.7-5L6 5Zm2.2-.1c0 .7 1.7 1.4 3.8 1.4s3.8-.7 3.8-1.4S14.1 3.5 12 3.5s-3.8.7-3.8 1.4ZM9 9v7h1.3V9H9Zm4 1v8h1.3v-8H13Z" />
  </svg>
  <svg v-else-if="icon === 'forearm'" class="muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 11V4.5a1.2 1.2 0 0 1 2.4 0V10h.9V2.7a1.2 1.2 0 0 1 2.4 0V10h.9V3.5a1.2 1.2 0 0 1 2.4 0V11h.9V6a1.2 1.2 0 0 1 2.4 0v8.7c0 4.4-2.6 7.3-6.6 7.3-2.7 0-4.4-1.3-5.8-3.5L3 12.2c-.5-.8-.2-1.6.5-2s1.4-.2 2 .5L7 13v-2Z" />
  </svg>
  <span v-else class="exercise-color-dot" aria-hidden="true"></span>
</template>

<style scoped>
.muscle-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  fill: var(--category-color, #7c7c85);
}
.muscle-icon-outline {
  fill: none;
  stroke: var(--category-color, #7c7c85);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
