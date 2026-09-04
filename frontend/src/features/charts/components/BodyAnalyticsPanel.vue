<script setup>
import { computed, ref } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'
import { createBodyAnalytics } from '../analytics/bodyAnalytics.js'
import { normalizeSelectableDateInterval } from '../analytics/dateRanges.js'
import { useChartDateInterval } from '../composables/useChartDateInterval.js'
import DateRangeControl from './DateRangeControl.vue'
import TimeSeriesChart from './TimeSeriesChart.vue'

const props = defineProps({
  measurements: { type: Array, required: true },
})

const measurementOptions = computed(sortMeasurements)
const selectedMeasurementId = ref(findInitialMeasurementId())
const { startDate: selectedStartDate, endDate: selectedEndDate } = useChartDateInterval()
const appliedStartDate = ref(selectedStartDate.value)
const appliedEndDate = ref(selectedEndDate.value)
const scaleMode = ref('auto')
const selectedMeasurement = computed(findSelectedMeasurement)
const analytics = computed(buildAnalytics)
const hasDateChanges = computed(readHasDateChanges)

function findInitialMeasurementId() {
  for (const measurement of measurementOptions.value) {
    if (measurement.records.length) return String(measurement.id)
  }
  return measurementOptions.value.length ? String(measurementOptions.value[0].id) : ''
}

function findSelectedMeasurement() {
  for (const measurement of measurementOptions.value) {
    if (String(measurement.id) === selectedMeasurementId.value) return measurement
  }
  return measurementOptions.value[0] ?? null
}

function sortMeasurements() {
  return [...props.measurements].sort(compareMeasurements)
}

function compareMeasurements(first, second) {
  if (first.favorite !== second.favorite) return first.favorite ? -1 : 1
  if (first.favorite) {
    const orderDifference = readFavoriteOrder(first) - readFavoriteOrder(second)
    if (orderDifference !== 0) return orderDifference
  }
  return first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
}

function readFavoriteOrder(measurement) {
  return Number.isInteger(measurement.favoriteOrder)
    ? measurement.favoriteOrder
    : Number.MAX_SAFE_INTEGER
}

function buildAnalytics() {
  return createBodyAnalytics(
    selectedMeasurement.value,
    appliedStartDate.value,
    appliedEndDate.value,
  )
}

function applyDateInterval() {
  const interval = normalizeSelectableDateInterval(selectedStartDate.value, selectedEndDate.value)
  if (!interval) return
  appliedStartDate.value = interval.startDate
  appliedEndDate.value = interval.endDate
}

function readHasDateChanges() {
  return (
    selectedStartDate.value !== appliedStartDate.value ||
    selectedEndDate.value !== appliedEndDate.value
  )
}

function setAutomaticScale() {
  scaleMode.value = 'auto'
}

function setZeroScale() {
  scaleMode.value = 'zero'
}

function formatValue(value) {
  if (value === null) return '—'
  const unit = selectedMeasurement.value?.unit
  return `${formatNumber(value)}${unit ? ` ${unit}` : ''}`
}

function formatChange() {
  if (analytics.value.change === null) return '—'
  const sign = analytics.value.change > 0 ? '+' : ''
  return `${sign}${formatValue(analytics.value.change)}`
}

function formatRange() {
  if (analytics.value.minimum === null) return '—'
  return `${formatNumber(analytics.value.minimum)}–${formatNumber(analytics.value.maximum)}`
}

function formatChangePercent() {
  if (analytics.value.changePercent === null) return ''
  const sign = analytics.value.changePercent > 0 ? '+' : ''
  return `${sign}${formatNumber(analytics.value.changePercent)}% in selected period`
}
</script>

<template>
  <div class="charts-panel-stack">
    <section class="chart-control-card">
      <div class="chart-card-heading">
        <div>
          <p class="eyebrow">BODY TREND</p>
          <h2>Measurements over time</h2>
        </div>
        <span class="chart-data-count">{{ analytics.records.length }} points</span>
      </div>

      <div class="chart-control-grid">
        <label class="chart-select-field">
          <span>Y axis · Measurement</span>
          <select v-model="selectedMeasurementId">
            <option
              v-for="measurement in measurementOptions"
              :key="measurement.id"
              :value="String(measurement.id)"
            >
              {{ measurement.name }}{{ measurement.records.length ? '' : ' · No data' }}
            </option>
          </select>
        </label>

        <div class="chart-axis-control">
          <span>Y axis · Scale</span>
          <div class="chart-inline-toggle">
            <button type="button" :class="{ 'is-active': scaleMode === 'auto' }" @click="setAutomaticScale">
              Auto
            </button>
            <button type="button" :class="{ 'is-active': scaleMode === 'zero' }" @click="setZeroScale">
              From zero
            </button>
          </div>
        </div>
      </div>

      <div class="chart-range-control">
        <span>X axis · Time range</span>
        <DateRangeControl
          v-model:start-date="selectedStartDate"
          v-model:end-date="selectedEndDate"
          :action-disabled="!hasDateChanges"
          @apply="applyDateInterval"
        />
      </div>
    </section>

    <section v-if="analytics.records.length" class="chart-visual-card body-line-chart-card">
      <div class="chart-card-heading chart-card-heading-compact">
        <div>
          <p class="eyebrow">{{ selectedMeasurement?.unit || 'VALUE' }}</p>
          <h2>{{ selectedMeasurement?.name }}</h2>
        </div>
        <p class="chart-current-value">{{ formatValue(analytics.current) }}</p>
      </div>
      <TimeSeriesChart
        :records="analytics.records"
        :scale-mode="scaleMode"
        :unit="selectedMeasurement?.unit"
      />
    </section>

    <section v-else class="chart-empty-card">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18 9 12l4 3 7-9" />
        <circle cx="4" cy="18" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="13" cy="15" r="1.5" />
        <circle cx="20" cy="6" r="1.5" />
      </svg>
      <strong>No values in this range</strong>
      <p>Choose another measurement or a longer time range.</p>
    </section>

    <section class="chart-metric-grid" aria-label="Body measurement summary">
      <article>
        <span>Current</span>
        <strong>{{ formatValue(analytics.current) }}</strong>
      </article>
      <article>
        <span>Period change</span>
        <strong :class="{ 'is-positive': analytics.change > 0, 'is-negative': analytics.change < 0 }">
          {{ formatChange() }}
        </strong>
        <small>{{ formatChangePercent() }}</small>
      </article>
      <article>
        <span>Average</span>
        <strong>{{ formatValue(analytics.average) }}</strong>
      </article>
      <article>
        <span>Low — High</span>
        <strong>{{ formatRange() }} {{ analytics.minimum === null ? '' : selectedMeasurement?.unit }}</strong>
      </article>
    </section>
  </div>
</template>
