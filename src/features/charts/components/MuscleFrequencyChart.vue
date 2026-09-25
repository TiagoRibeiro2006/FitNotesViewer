<script setup>
import { computed } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'

const props = defineProps({
  muscles: { type: Array, required: true },
})

const visibleMuscles = computed(readVisibleMuscles)
const maximum = computed(readMaximum)

function readVisibleMuscles() {
  return [...props.muscles]
    .sort(compareFrequency)
    .slice(0, 8)
}

function readMaximum() {
  return visibleMuscles.value[0]?.sessionsPerWeek ?? 0
}

function compareFrequency(first, second) {
  return second.sessionsPerWeek - first.sessionsPerWeek || second.sets - first.sets
}

function barStyle(muscle) {
  const width = maximum.value ? (muscle.sessionsPerWeek / maximum.value) * 100 : 0
  return { width: `${width}%`, background: muscle.color }
}

function formatFrequency(value) {
  return `${formatNumber(value)}× / week`
}
</script>

<template>
  <div class="frequency-chart">
    <div v-for="muscle in visibleMuscles" :key="muscle.id" class="frequency-row">
      <div>
        <span>{{ muscle.name }}</span>
        <strong>{{ formatFrequency(muscle.sessionsPerWeek) }}</strong>
      </div>
      <div class="frequency-track"><i :style="barStyle(muscle)"></i></div>
    </div>
    <p v-if="!visibleMuscles.length" class="chart-inline-empty">No frequency data yet.</p>
  </div>
</template>
