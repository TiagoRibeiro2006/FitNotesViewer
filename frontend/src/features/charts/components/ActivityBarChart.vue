<script setup>
import { computed, ref, watch } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'

const props = defineProps({
  rows: { type: Array, required: true },
  metric: { type: String, required: true },
})

const MAXIMUM_BARS = 16
const selectedIndex = ref(-1)
const displayRows = computed(buildDisplayRows)
const maximum = computed(readMaximum)
const chartStyle = computed(readChartStyle)
const selectedRow = computed(readSelectedRow)

watch(
  function readSelectionSource() {
    return [props.rows, props.metric]
  },
  selectLatest,
  { immediate: true },
)

function selectLatest() {
  selectedIndex.value = displayRows.value.length - 1
}

function selectRow(index) {
  selectedIndex.value = index
}

function readMaximum() {
  let value = 0
  for (const row of displayRows.value) value = Math.max(value, Number(row[props.metric]) || 0)
  return value
}

function readChartStyle() {
  return { '--activity-bar-count': Math.max(1, displayRows.value.length) }
}

function readSelectedRow() {
  return displayRows.value[selectedIndex.value] ?? null
}

function buildDisplayRows() {
  if (props.rows.length <= MAXIMUM_BARS) return props.rows

  const groupSize = Math.ceil(props.rows.length / MAXIMUM_BARS)
  const rows = []
  for (let index = 0; index < props.rows.length; index += groupSize) {
    rows.push(mergeRows(props.rows.slice(index, index + groupSize)))
  }
  return rows
}

function mergeRows(rows) {
  const merged = {
    date: rows[0].date,
    endDate: rows.at(-1).date,
    sets: 0,
    reps: 0,
    volume: 0,
    workouts: 0,
  }

  for (const row of rows) {
    merged.sets += row.sets
    merged.reps += row.reps
    merged.volume += row.volume
    merged.workouts += row.workouts
  }
  return merged
}

function barStyle(row) {
  const value = Number(row[props.metric]) || 0
  const height = maximum.value ? Math.max(3, (value / maximum.value) * 100) : 0
  return { height: `${height}%` }
}

function shouldShowLabel(index) {
  if (displayRows.value.length <= 8) return true
  const interval = Math.ceil(displayRows.value.length / 5)
  return index === 0 || index === displayRows.value.length - 1 || index % interval === 0
}

function formatPeriod(row) {
  if (!row.endDate || row.endDate === row.date) return `Week of ${formatWeek(row.date)}`
  return `${formatWeek(row.date)} – ${formatWeek(row.endDate)}`
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
    <div class="activity-chart" :style="chartStyle">
      <button
        v-for="(row, index) in displayRows"
        :key="row.date"
        type="button"
        :class="{ 'is-selected': index === selectedIndex }"
        :aria-label="`${formatPeriod(row)}, ${formatMetricValue(row)}`"
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
    <span>{{ formatPeriod(selectedRow) }}</span>
    <strong>{{ formatMetricValue(selectedRow) }}</strong>
  </div>
</template>
