<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'

const props = defineProps({
  entries: { type: Array, required: true },
  metric: { type: String, required: true },
  metricLabel: { type: String, required: true },
})

const chartRoot = ref(null)
const selectedId = ref(null)
const chartEntries = computed(buildChartEntries)
const segments = computed(buildSegments)
const total = computed(calculateTotal)
const selectedSegment = computed(readSelectedSegment)
const popoverStyle = computed(buildPopoverStyle)

onMounted(addOutsideListener)
onBeforeUnmount(removeOutsideListener)

watch(
  function readChartSelectionSource() {
    return [props.metric, props.entries]
  },
  clearSelection,
)

function buildChartEntries() {
  const entries = []
  for (const entry of props.entries) {
    const value = Number(entry[props.metric])
    if (value > 0) entries.push({ ...entry, chartValue: value })
  }
  entries.sort(compareChartValues)
  return entries
}

function calculateTotal() {
  let value = 0
  for (const entry of chartEntries.value) value += entry.chartValue
  return value
}

function buildSegments() {
  if (!total.value) return []

  const result = []
  let offset = 0
  for (const entry of chartEntries.value) {
    const percentage = (entry.chartValue / total.value) * 100
    const visiblePercentage = Math.max(percentage * .7, percentage - .65)
    result.push({
      ...entry,
      percentage,
      dashArray: `${visiblePercentage} ${100 - visiblePercentage}`,
      dashOffset: -offset,
      middleAngle: -90 + (offset + percentage / 2) * 3.6,
    })
    offset += percentage
  }
  return result
}

function compareChartValues(first, second) {
  return second.chartValue - first.chartValue || first.name.localeCompare(second.name)
}

function selectSegment(segment) {
  selectedId.value = segment.id
}

function clearSelection() {
  selectedId.value = null
}

function readSelectedSegment() {
  for (const segment of segments.value) {
    if (String(segment.id) === String(selectedId.value)) return segment
  }
  return null
}

function buildPopoverStyle() {
  const segment = selectedSegment.value
  if (!segment) return {}

  const radians = segment.middleAngle * Math.PI / 180
  const top = Math.min(80, Math.max(20, 50 + Math.sin(radians) * 32))
  const property = Math.cos(radians) >= 0 ? 'right' : 'left'
  return {
    [property]: '0',
    top: `${top}%`,
    borderColor: segment.color,
  }
}

function isSelected(segment) {
  return String(segment.id) === String(selectedId.value)
}

function addOutsideListener() {
  document.addEventListener('pointerdown', handleOutsidePointer)
}

function removeOutsideListener() {
  document.removeEventListener('pointerdown', handleOutsidePointer)
}

function handleOutsidePointer(event) {
  if (selectedId.value === null || chartRoot.value?.contains(event.target)) return
  clearSelection()
}

function formatTotal() {
  return compactNumber(total.value)
}

function formatEntryValue(entry) {
  const value = compactNumber(entry.chartValue)
  if (props.metric === 'volume') return `${value} kg`
  return `${value} ${props.metricLabel}`
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
  <div ref="chartRoot" class="donut-chart-layout" @click="clearSelection">
    <div class="donut-chart-stage">
      <svg
        class="donut-chart"
        viewBox="0 0 120 120"
        role="img"
        :aria-label="`${formatTotal()} ${metricLabel} distributed across ${chartEntries.length} muscles`"
      >
        <circle class="donut-chart-track" cx="60" cy="60" r="42" />
        <g v-for="segment in segments" :key="segment.id" transform="rotate(-90 60 60)">
          <circle
            v-if="isSelected(segment)"
            class="donut-segment-outline"
            cx="60"
            cy="60"
            r="42"
            pathLength="100"
            :stroke="segment.color"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
          />
          <circle
            class="donut-segment"
            :class="{ 'is-selected': isSelected(segment) }"
            cx="60"
            cy="60"
            r="42"
            pathLength="100"
            :stroke="segment.color"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            tabindex="0"
            role="button"
            :aria-label="`${segment.name}, ${formatPercentage(segment)}, ${formatEntryValue(segment)}`"
            @click.stop="selectSegment(segment)"
            @keydown.enter.stop="selectSegment(segment)"
            @keydown.space.stop.prevent="selectSegment(segment)"
          />
        </g>
      </svg>

      <div class="donut-chart-center">
        <strong>{{ formatTotal() }}</strong>
        <span>{{ metricLabel }}</span>
      </div>

      <div v-if="selectedSegment" class="donut-selection-popover" :style="popoverStyle">
        <strong>{{ selectedSegment.name }}</strong>
        <span>{{ formatPercentage(selectedSegment) }}</span>
        <small>{{ formatEntryValue(selectedSegment) }}</small>
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
