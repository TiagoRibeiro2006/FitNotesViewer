<script setup>
import { computed } from 'vue'

const props = defineProps({ name: { type: String, default: '' } })
const isAbs = computed(readIsAbs)

function readIsAbs() {
  return props.name.trim().toLowerCase() === 'abs'
}
</script>

<template>
  <svg v-if="isAbs" class="abs-muscle-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 2H6C3 2 2 3 2 5c0 3 1 5 4 5h4c1 0 1.5-.5 1.5-1.5v-5C11.5 2.5 11 2 10 2Zm4 0h4c3 0 4 1 4 3 0 3-1 5-4 5h-4c-1 0-1.5-.5-1.5-1.5v-5C12.5 2.5 13 2 14 2ZM10 11H6c-2 0-3 1-2.5 3 .5 2.5 1.5 3 4 3H10c1 0 1.5-.5 1.5-1.5v-3C11.5 11.5 11 11 10 11Zm4 0h4c2 0 3 1 2.5 3-.5 2.5-1.5 3-4 3H14c-1 0-1.5-.5-1.5-1.5v-3c0-1 .5-1.5 1.5-1.5Zm-4 7H7c-2 0-2.5 1-1 2.5C7.5 22 9 23 10 23s1.5-.5 1.5-1.5v-2C11.5 18.5 11 18 10 18Zm4 0h3c2 0 2.5 1 1 2.5C16.5 22 15 23 14 23s-1.5-.5-1.5-1.5v-2c0-1 .5-1.5 1.5-1.5Z" />
  </svg>
  <span v-else class="exercise-color-dot" aria-hidden="true"></span>
</template>

<style scoped>
.abs-muscle-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  fill: var(--category-color, #7c7c85);
}
</style>
