<script setup>
import { computed } from 'vue'

const props = defineProps({
  days: { type: Array, required: true },
})

const maximum = computed(readMaximum)

function readMaximum() {
  let value = 0
  for (const day of props.days) value = Math.max(value, day.workouts)
  return value
}

function barStyle(day) {
  const height = maximum.value ? (day.workouts / maximum.value) * 100 : 0
  return { height: `${height}%` }
}
</script>

<template>
  <div class="weekday-chart" role="img" aria-label="Workout frequency by weekday">
    <div v-for="day in days" :key="day.id">
      <strong>{{ day.workouts }}</strong>
      <span class="weekday-bar-track"><i :style="barStyle(day)"></i></span>
      <small>{{ day.label }}</small>
    </div>
  </div>
</template>
