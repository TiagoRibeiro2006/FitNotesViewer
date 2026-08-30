<script setup>
const props = defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

function selectRange(rangeId) {
  if (rangeId !== props.modelValue) emit('update:modelValue', rangeId)
}
</script>

<template>
  <div class="chart-range-selector" role="group" aria-label="Date range">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      :class="{ 'is-active': option.id === modelValue }"
      :aria-pressed="option.id === modelValue"
      @click="selectRange(option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
