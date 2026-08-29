<script setup>
import { computed, ref } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'
import { CHART_RANGE_OPTIONS } from '../analytics/dateRanges.js'
import { createTrainingAnalytics } from '../analytics/trainingAnalytics.js'
import ActivityBarChart from './ActivityBarChart.vue'
import ChartMetricSelector from './ChartMetricSelector.vue'
import ChartRangeSelector from './ChartRangeSelector.vue'
import DonutChart from './DonutChart.vue'
import ExerciseRanking from './ExerciseRanking.vue'
import MuscleFrequencyChart from './MuscleFrequencyChart.vue'
import WeekdayChart from './WeekdayChart.vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const DISTRIBUTION_METRICS = [
  { id: 'sets', label: 'Sets' },
  { id: 'volume', label: 'Volume' },
  { id: 'sessions', label: 'Sessions' },
]
const ACTIVITY_METRICS = [
  { id: 'sets', label: 'Sets' },
  { id: 'volume', label: 'Volume' },
  { id: 'workouts', label: 'Days' },
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
const activityMetric = ref('sets')
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

function formatCompact(value) {
  if (Math.abs(value) < 10000) return formatNumber(value)
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function formatVolume(value) {
  return `${formatCompact(value)} kg`
}

function formatRate(value) {
  return `${formatNumber(value)}×`
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

    <section class="training-metric-grid" aria-label="Training summary">
      <article>
        <span>Workout days</span>
        <strong>{{ analytics.workoutCount }}</strong>
        <small>{{ formatRate(analytics.workoutsPerWeek) }} per week</small>
      </article>
      <article>
        <span>Total sets</span>
        <strong>{{ formatCompact(analytics.totalSets) }}</strong>
        <small>{{ formatNumber(analytics.averageSetsPerWorkout) }} per workout</small>
      </article>
      <article>
        <span>Training volume</span>
        <strong>{{ formatVolume(analytics.totalVolume) }}</strong>
        <small>Weight × reps</small>
      </article>
      <article>
        <span>Total reps</span>
        <strong>{{ formatCompact(analytics.totalReps) }}</strong>
        <small>Across {{ analytics.exerciseCount }} exercises</small>
      </article>
      <article>
        <span>Progress sets</span>
        <strong>{{ analytics.progressSets }}</strong>
        <small>New weight or rep progress</small>
      </article>
      <article>
        <span>Longest streak</span>
        <strong>{{ analytics.longestStreak }} days</strong>
        <small>Consecutive workout days</small>
      </article>
    </section>

    <template v-if="analytics.totalSets">
      <div class="training-dashboard-grid">
        <section class="chart-visual-card">
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

      <section class="chart-visual-card">
        <div class="chart-card-heading training-chart-heading">
          <div>
            <p class="eyebrow">WEEKLY LOAD</p>
            <h2>Training activity</h2>
          </div>
          <ChartMetricSelector
            v-model="activityMetric"
            :options="ACTIVITY_METRICS"
            label="Weekly activity metric"
          />
        </div>
        <ActivityBarChart :rows="analytics.weeklyActivity" :metric="activityMetric" />
      </section>

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
