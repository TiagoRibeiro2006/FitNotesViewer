<script setup>
const props = defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true },
  label: { type: String, default: 'Chart metric' },
})

const emit = defineEmits(['update:modelValue'])

function selectMetric(metricId) {
  if (metricId !== props.modelValue) emit('update:modelValue', metricId)
}
</script>

<template>
  <div class="chart-metric-selector" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      :class="{ 'is-active': option.id === modelValue }"
      :aria-pressed="option.id === modelValue"
      @click="selectMetric(option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
