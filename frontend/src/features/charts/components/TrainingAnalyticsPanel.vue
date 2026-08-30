<script setup>
import { computed, ref } from 'vue'
import { CHART_RANGE_OPTIONS } from '../analytics/dateRanges.js'
import { createTrainingAnalytics } from '../analytics/trainingAnalytics.js'
import ChartMetricSelector from './ChartMetricSelector.vue'
import ChartRangeSelector from './ChartRangeSelector.vue'
import DonutChart from './DonutChart.vue'
import ExerciseRanking from './ExerciseRanking.vue'
import MuscleFrequencyChart from './MuscleFrequencyChart.vue'
import TrainingInsights from './TrainingInsights.vue'
import WeekdayChart from './WeekdayChart.vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const DISTRIBUTION_METRICS = [
  { id: 'sets', label: 'Sets' },
  { id: 'volume', label: 'Volume' },
  { id: 'sessions', label: 'Sessions' },
]
const RANKING_METRICS = [
  { id: 'volume', label: 'Volume' },
  { id: 'sets', label: 'Sets' },
  { id: 'sessions', label: 'Days' },
  { id: 'progressSets', label: 'Progress' },
]

const selectedRange = ref('90d')
const selectedMuscleId = ref('all')
const distributionMetric = ref('sets')
const rankingMetric = ref('volume')
const analytics = computed(buildAnalytics)
const availableMuscles = computed(readAvailableMuscles)
const distributionLabel = computed(readDistributionLabel)
const strongestMuscle = computed(readStrongestMuscle)

function buildAnalytics() {
  return createTrainingAnalytics(props.data, selectedRange.value, selectedMuscleId.value)
}

function readAvailableMuscles() {
  return createTrainingAnalytics(props.data, 'all').muscleDistribution
}

function readDistributionLabel() {
  for (const option of DISTRIBUTION_METRICS) {
    if (option.id === distributionMetric.value) return option.label.toLowerCase()
  }
  return 'sets'
}

function readStrongestMuscle() {
  return analytics.value.muscleDistribution[0] ?? null
}

</script>

<template>
  <div class="charts-panel-stack">
    <section class="chart-control-card">
      <div class="chart-card-heading">
        <div>
          <p class="eyebrow">TRAINING OVERVIEW</p>
          <h2>Analyse your workload</h2>
        </div>
        <span class="chart-data-count">{{ analytics.totalSets }} sets</span>
      </div>
      <div class="training-filter-grid">
        <div class="chart-range-control chart-range-control-first">
          <span>Analysis period</span>
          <ChartRangeSelector v-model="selectedRange" :options="CHART_RANGE_OPTIONS" />
        </div>

        <label class="chart-select-field">
          <span>Muscle focus</span>
          <select v-model="selectedMuscleId">
            <option value="all">All muscles</option>
            <option v-for="muscle in availableMuscles" :key="muscle.id" :value="String(muscle.id)">
              {{ muscle.name }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <template v-if="analytics.totalSets">
      <div
        class="training-dashboard-grid"
        :class="{ 'is-single': selectedMuscleId !== 'all' }"
      >
        <section v-if="selectedMuscleId === 'all'" class="chart-visual-card">
          <div class="chart-card-heading training-chart-heading">
            <div>
              <p class="eyebrow">MUSCLE BALANCE</p>
              <h2>Distribution</h2>
            </div>
            <ChartMetricSelector
              v-model="distributionMetric"
              :options="DISTRIBUTION_METRICS"
              label="Muscle distribution metric"
            />
          </div>
          <DonutChart
            :entries="analytics.muscleDistribution"
            :metric="distributionMetric"
            :metric-label="distributionLabel"
          />
        </section>

        <section class="chart-visual-card">
          <div class="chart-card-heading training-chart-heading">
            <div>
              <p class="eyebrow">FREQUENCY</p>
              <h2>Muscles per week</h2>
            </div>
            <span v-if="strongestMuscle" class="chart-leading-label">
              {{ strongestMuscle.name }} leads
            </span>
          </div>
          <MuscleFrequencyChart :muscles="analytics.muscleDistribution" />
        </section>
      </div>

      <div class="training-dashboard-grid training-dashboard-grid-bottom">
        <section class="chart-visual-card">
          <div class="chart-card-heading training-chart-heading">
            <div>
              <p class="eyebrow">RHYTHM</p>
              <h2>Favourite days</h2>
            </div>
          </div>
          <WeekdayChart :days="analytics.weekdayDistribution" />
        </section>

        <section class="chart-visual-card">
          <div class="chart-card-heading training-chart-heading">
            <div>
              <p class="eyebrow">EXERCISES</p>
              <h2>Top performers</h2>
            </div>
            <ChartMetricSelector
              v-model="rankingMetric"
              :options="RANKING_METRICS"
              label="Exercise ranking metric"
            />
          </div>
          <ExerciseRanking :exercises="analytics.exerciseRanking" :metric="rankingMetric" />
        </section>
      </div>

      <TrainingInsights :analytics="analytics" />
    </template>

    <section v-else class="chart-empty-card">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V9m5 10V5m6 14v-7m5 7V3" />
      </svg>
      <strong>No workouts in this range</strong>
      <p>Choose a longer period or add sets in the Log.</p>
    </section>
  </div>
</template>
