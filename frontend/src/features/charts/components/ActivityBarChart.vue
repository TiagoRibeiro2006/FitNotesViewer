<script setup>
import { computed, ref, watch } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'

const props = defineProps({
  rows: { type: Array, required: true },
  metric: { type: String, required: true },
})

const selectedIndex = ref(-1)
const maximum = computed(readMaximum)
const chartWidth = computed(readChartWidth)
const selectedRow = computed(readSelectedRow)

watch(
  function readSelectionSource() {
    return [props.rows, props.metric]
  },
  selectLatest,
  { immediate: true },
)

function selectLatest() {
  selectedIndex.value = props.rows.length - 1
}

function selectRow(index) {
  selectedIndex.value = index
}

function readMaximum() {
  let value = 0
  for (const row of props.rows) value = Math.max(value, Number(row[props.metric]) || 0)
  return value
}

function readChartWidth() {
  return `${Math.max(100, props.rows.length * 8)}%`
}

function readSelectedRow() {
  return props.rows[selectedIndex.value] ?? null
}

function barStyle(row) {
  const value = Number(row[props.metric]) || 0
  const height = maximum.value ? Math.max(3, (value / maximum.value) * 100) : 0
  return { height: `${height}%` }
}

function shouldShowLabel(index) {
  if (props.rows.length <= 8) return true
  const interval = Math.ceil(props.rows.length / 6)
  return index === 0 || index === props.rows.length - 1 || index % interval === 0
}

function formatWeek(dateKey) {
  const parts = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
    .format(new Date(parts[0], parts[1] - 1, parts[2]))
}

function formatMetricValue(row) {
  const value = Number(row?.[props.metric]) || 0
  const formatted = value >= 10000
    ? new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    : formatNumber(value)
  return props.metric === 'volume' ? `${formatted} kg` : formatted
}
</script>

<template>
  <div class="activity-chart-scroll">
    <div class="activity-chart" :style="{ width: chartWidth }">
      <button
        v-for="(row, index) in rows"
        :key="row.date"
        type="button"
        :class="{ 'is-selected': index === selectedIndex }"
        :aria-label="`Week of ${formatWeek(row.date)}, ${formatMetricValue(row)}`"
        @click="selectRow(index)"
      >
        <span class="activity-bar-track">
          <i :style="barStyle(row)"></i>
        </span>
        <small>{{ shouldShowLabel(index) ? formatWeek(row.date) : '' }}</small>
      </button>
    </div>
  </div>

  <div v-if="selectedRow" class="activity-chart-selection">
    <span>Week of {{ formatWeek(selectedRow.date) }}</span>
    <strong>{{ formatMetricValue(selectedRow) }}</strong>
  </div>
</template>
