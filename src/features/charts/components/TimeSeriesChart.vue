<script setup>
import { computed, ref, watch } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'
import { dateKeyToTime } from '../analytics/dateRanges.js'

const props = defineProps({
  records: { type: Array, required: true },
  scaleMode: { type: String, default: 'auto' },
  unit: { type: String, default: '' },
})

const selectedIndex = ref(-1)
const chart = computed(buildChart)
const selectedPoint = computed(readSelectedPoint)

watch(
  function readRecords() {
    return props.records
  },
  selectLatestPoint,
  { immediate: true },
)

function selectLatestPoint() {
  selectedIndex.value = props.records.length - 1
}

function selectPoint(index) {
  selectedIndex.value = index
}

function readSelectedPoint() {
  if (selectedIndex.value < 0) return null
  return chart.value.points[selectedIndex.value] ?? null
}

function buildChart() {
  const width = 720
  const height = 300
  const area = { left: 62, right: 18, top: 28, bottom: 48 }
  const innerWidth = width - area.left - area.right
  const innerHeight = height - area.top - area.bottom
  const values = props.records.map(readValue)
  const times = props.records.map(readTime)
  const domain = buildValueDomain(values, props.scaleMode)
  const timeDomain = buildTimeDomain(times)
  const points = []

  for (let index = 0; index < props.records.length; index += 1) {
    const record = props.records[index]
    points.push({
      index,
      record,
      x: scaleValue(times[index], timeDomain.minimum, timeDomain.maximum, area.left, area.left + innerWidth),
      y: scaleValue(values[index], domain.minimum, domain.maximum, area.top + innerHeight, area.top),
    })
  }

  return {
    width,
    height,
    area,
    innerWidth,
    innerHeight,
    points,
    polyline: points.map(formatPoint).join(' '),
    horizontalGuides: buildHorizontalGuides(domain, area, innerHeight),
    dateLabels: buildDateLabels(props.records, points),
  }
}

function buildValueDomain(values, scaleMode) {
  let minimum = Math.min(...values)
  let maximum = Math.max(...values)
  if (scaleMode === 'zero') minimum = Math.min(0, minimum)

  if (minimum === maximum) {
    const padding = Math.max(1, Math.abs(minimum) * 0.08)
    minimum = scaleMode === 'zero' ? 0 : minimum - padding
    maximum += padding
  } else if (scaleMode !== 'zero') {
    const padding = (maximum - minimum) * 0.12
    minimum -= padding
    maximum += padding
  } else {
    maximum += Math.max(1, maximum * 0.08)
  }

  return { minimum, maximum }
}

function buildTimeDomain(times) {
  const minimum = Math.min(...times)
  const maximum = Math.max(...times)
  if (minimum === maximum) return { minimum: minimum - 43200000, maximum: maximum + 43200000 }
  return { minimum, maximum }
}

function buildHorizontalGuides(domain, area, innerHeight) {
  const guides = []
  const count = 4

  for (let index = 0; index <= count; index += 1) {
    const ratio = index / count
    guides.push({
      y: area.top + innerHeight * ratio,
      value: domain.maximum - (domain.maximum - domain.minimum) * ratio,
    })
  }
  return guides
}

function buildDateLabels(records, points) {
  if (!records.length) return []
  const indexes = records.length === 1
    ? [0]
    : [0, Math.floor((records.length - 1) / 2), records.length - 1]
  const labels = []
  const used = new Set()

  for (const index of indexes) {
    if (used.has(index)) continue
    used.add(index)
    labels.push({ x: points[index].x, label: formatShortDate(records[index].date) })
  }
  return labels
}

function readValue(record) {
  return Number(record.value)
}

function readTime(record) {
  const time = String(record.time ?? '00:00:00')
  const parts = time.split(':').map(Number)
  return dateKeyToTime(record.date) + ((parts[0] * 60 + parts[1]) * 60 + (parts[2] || 0)) * 1000
}

function scaleValue(value, minimum, maximum, targetMinimum, targetMaximum) {
  return targetMinimum + ((value - minimum) / (maximum - minimum)) * (targetMaximum - targetMinimum)
}

function formatPoint(point) {
  return `${point.x},${point.y}`
}

function formatAxisValue(value) {
  return formatNumber(value)
}

function formatSelectedValue(value) {
  return `${formatNumber(value)}${props.unit ? ` ${props.unit}` : ''}`
}

function formatShortDate(dateKey) {
  const parts = String(dateKey).split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
    .format(new Date(parts[0], parts[1] - 1, parts[2]))
}

function formatLongDate(record) {
  const parts = String(record.date).split('-').map(Number)
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parts[0], parts[1] - 1, parts[2]))
  const time = String(record.time ?? '').slice(0, 5)
  return time && time !== '00:00' ? `${date} at ${time}` : date
}
</script>

<template>
  <div class="time-series-chart">
    <svg
      :viewBox="`0 0 ${chart.width} ${chart.height}`"
      role="img"
      aria-label="Measurement values over time"
    >
      <g class="time-series-grid">
        <g v-for="guide in chart.horizontalGuides" :key="guide.y">
          <line
            :x1="chart.area.left"
            :x2="chart.area.left + chart.innerWidth"
            :y1="guide.y"
            :y2="guide.y"
          />
          <text :x="chart.area.left - 10" :y="guide.y + 4">{{ formatAxisValue(guide.value) }}</text>
        </g>
      </g>

      <polyline v-if="chart.points.length > 1" class="time-series-line-glow" :points="chart.polyline" />
      <polyline v-if="chart.points.length > 1" class="time-series-line" :points="chart.polyline" />

      <g class="time-series-points">
        <circle
          v-for="point in chart.points"
          :key="point.record.id"
          :class="{ 'is-selected': point.index === selectedIndex }"
          :cx="point.x"
          :cy="point.y"
          :r="point.index === selectedIndex ? 7 : 5"
          tabindex="0"
          role="button"
          :aria-label="`${formatSelectedValue(point.record.value)}, ${formatLongDate(point.record)}`"
          @click="selectPoint(point.index)"
          @keydown.enter="selectPoint(point.index)"
          @keydown.space.prevent="selectPoint(point.index)"
        />
      </g>

      <g class="time-series-dates">
        <text
          v-for="label in chart.dateLabels"
          :key="`${label.x}-${label.label}`"
          :x="label.x"
          :y="chart.height - 13"
        >
          {{ label.label }}
        </text>
      </g>
    </svg>

    <div v-if="selectedPoint" class="time-series-selection" aria-live="polite">
      <strong>{{ formatSelectedValue(selectedPoint.record.value) }}</strong>
      <span>{{ formatLongDate(selectedPoint.record) }}</span>
    </div>
  </div>
</template>
