<script setup>
import { computed } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'

const props = defineProps({
  entries: { type: Array, required: true },
  metric: { type: String, required: true },
  metricLabel: { type: String, required: true },
})

const chartEntries = computed(buildChartEntries)
const total = computed(calculateTotal)
const donutStyle = computed(buildDonutStyle)

function buildChartEntries() {
  const entries = []
  for (const entry of props.entries) {
    const value = Number(entry[props.metric])
    if (value > 0) entries.push({ ...entry, chartValue: value })
  }
  return entries
}

function calculateTotal() {
  let value = 0
  for (const entry of chartEntries.value) value += entry.chartValue
  return value
}

function buildDonutStyle() {
  if (!total.value) return { background: '#202026' }

  const stops = []
  let position = 0
  for (const entry of chartEntries.value) {
    const start = position
    position += (entry.chartValue / total.value) * 100
    stops.push(`${entry.color} ${start}% ${position}%`)
  }
  return { background: `conic-gradient(${stops.join(', ')})` }
}

function formatTotal() {
  return compactNumber(total.value)
}

function formatEntryValue(entry) {
  const value = compactNumber(entry.chartValue)
  if (props.metric === 'volume') return `${value} kg`
  return value
}

function formatPercentage(entry) {
  if (!total.value) return '0%'
  return `${formatNumber((entry.chartValue / total.value) * 100)}%`
}

function compactNumber(value) {
  if (Math.abs(value) < 10000) return formatNumber(value)
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
</script>

<template>
  <div class="donut-chart-layout">
    <div
      class="donut-chart"
      :style="donutStyle"
      role="img"
      :aria-label="`${formatTotal()} ${metricLabel} distributed across ${chartEntries.length} muscles`"
    >
      <div class="donut-chart-center">
        <strong>{{ formatTotal() }}</strong>
        <span>{{ metricLabel }}</span>
      </div>
    </div>

    <div class="donut-legend">
      <div v-for="entry in chartEntries" :key="entry.id" class="donut-legend-row">
        <i :style="{ background: entry.color }"></i>
        <span>{{ entry.name }}</span>
        <strong>{{ formatPercentage(entry) }}</strong>
        <small>{{ formatEntryValue(entry) }}</small>
      </div>
      <p v-if="!chartEntries.length">No muscle data in this range.</p>
    </div>
  </div>
</template>
