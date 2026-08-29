<script setup>
import { computed, ref } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'
import { createBodyAnalytics } from '../analytics/bodyAnalytics.js'
import { CHART_RANGE_OPTIONS } from '../analytics/dateRanges.js'
import ChartRangeSelector from './ChartRangeSelector.vue'
import TimeSeriesChart from './TimeSeriesChart.vue'

const props = defineProps({
  measurements: { type: Array, required: true },
})

const selectedMeasurementId = ref(findInitialMeasurementId())
const selectedRange = ref('90d')
const scaleMode = ref('auto')
const selectedMeasurement = computed(findSelectedMeasurement)
const analytics = computed(buildAnalytics)

function findInitialMeasurementId() {
  for (const measurement of props.measurements) {
    if (measurement.records.length) return String(measurement.id)
  }
  return props.measurements.length ? String(props.measurements[0].id) : ''
}

function findSelectedMeasurement() {
  for (const measurement of props.measurements) {
    if (String(measurement.id) === selectedMeasurementId.value) return measurement
  }
  return props.measurements[0] ?? null
}

function buildAnalytics() {
  return createBodyAnalytics(selectedMeasurement.value, selectedRange.value)
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
              v-for="measurement in measurements"
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
        <ChartRangeSelector v-model="selectedRange" :options="CHART_RANGE_OPTIONS" />
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
