<script setup>
import { computed } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'

const props = defineProps({
  exercises: { type: Array, required: true },
  metric: { type: String, required: true },
})

const ranking = computed(buildRanking)
const maximum = computed(readMaximum)

function buildRanking() {
  return [...props.exercises]
    .sort(compareMetric)
    .slice(0, 8)
}

function compareMetric(first, second) {
  return Number(second[props.metric]) - Number(first[props.metric]) || first.name.localeCompare(second.name)
}

function readMaximum() {
  return Number(ranking.value[0]?.[props.metric]) || 0
}

function barStyle(exercise) {
  const value = Number(exercise[props.metric]) || 0
  const width = maximum.value ? (value / maximum.value) * 100 : 0
  return { width: `${width}%`, background: exercise.color }
}

function formatValue(exercise) {
  const value = Number(exercise[props.metric]) || 0
  const formatted = value >= 10000
    ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    : formatNumber(value)
  return props.metric === 'volume' ? `${formatted} kg` : formatted
}
</script>

<template>
  <div class="exercise-ranking">
    <article v-for="(exercise, index) in ranking" :key="exercise.id">
      <span class="exercise-rank-number">{{ index + 1 }}</span>
      <div class="exercise-rank-content">
        <div>
          <strong>{{ exercise.name }}</strong>
          <small>{{ exercise.muscleName }}</small>
          <b>{{ formatValue(exercise) }}</b>
        </div>
        <span class="exercise-rank-track"><i :style="barStyle(exercise)"></i></span>
      </div>
    </article>
    <p v-if="!ranking.length" class="chart-inline-empty">No exercise data yet.</p>
  </div>
</template>
