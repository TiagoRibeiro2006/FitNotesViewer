<script setup>
import { computed, ref } from 'vue'
import { analyzeTrainingPeriod } from '../../../ai/workout/analyzeTrainingPeriod.js'
import { evaluateTrainingPeriod } from '../../../ai/workout/evaluateTrainingPeriod.js'
import { generateTrainingFeedback } from '../../../ai/workout/generateTrainingFeedback.js'
import {
  buildTrainingPeriodWorkouts,
  countTrainingPeriodDays,
} from '../analytics/trainingPeriodInput.js'
import { normalizeSelectableDateInterval } from '../analytics/dateRanges.js'
import { useChartDateInterval } from '../composables/useChartDateInterval.js'
import DateRangeControl from './DateRangeControl.vue'
import TrainingRatingGuide from './TrainingRatingGuide.vue'

const props = defineProps({
  sets: { type: Array, required: true },
})

const { startDate: selectedStartDate, endDate: selectedEndDate } = useChartDateInterval()
const generatedStartDate = ref(selectedStartDate.value)
const generatedEndDate = ref(selectedEndDate.value)
const workouts = computed(buildWorkouts)
const periodDays = computed(readPeriodDays)
const analysis = computed(buildAnalysis)
const feedback = computed(buildFeedback)
const rating = computed(buildRating)
const ratingClass = computed(readRatingClass)
const hasDateChanges = computed(readHasDateChanges)

function buildWorkouts() {
  return buildTrainingPeriodWorkouts(
    props.sets,
    generatedStartDate.value,
    generatedEndDate.value,
  )
}

function readPeriodDays() {
  return countTrainingPeriodDays(generatedStartDate.value, generatedEndDate.value)
}

function buildAnalysis() {
  return analyzeTrainingPeriod(workouts.value)
}

function buildFeedback() {
  return generateTrainingFeedback(analysis.value, periodDays.value)
}

function buildRating() {
  return evaluateTrainingPeriod(analysis.value, periodDays.value)
}

function readRatingClass() {
  return 'is-' + rating.value.level
}

function generateAnalysis() {
  const period = normalizeSelectableDateInterval(selectedStartDate.value, selectedEndDate.value)
  if (!period) return

  generatedStartDate.value = period.startDate
  generatedEndDate.value = period.endDate
}

function readHasDateChanges() {
  return (
    selectedStartDate.value !== generatedStartDate.value ||
    selectedEndDate.value !== generatedEndDate.value
  )
}
</script>

<template>
  <section class="chart-visual-card training-analysis-card" :class="ratingClass">
    <div class="chart-card-heading training-chart-heading training-analysis-heading">
      <div>
        <p class="eyebrow">AI TRAINING ANALYSIS</p>
        <h2>What your training shows</h2>
      </div>
      <TrainingRatingGuide :level="rating.level" :label="rating.label" />
    </div>

    <DateRangeControl
      v-model:start-date="selectedStartDate"
      v-model:end-date="selectedEndDate"
      action-label="Generate"
      :action-disabled="!hasDateChanges"
      @apply="generateAnalysis"
    />

    <div class="training-analysis-report">
      <p>{{ feedback }}</p>
      <div class="training-analysis-report-footer">
        <small>Generated locally from the selected training period.</small>
        <button class="training-analysis-details-button" type="button">Details</button>
      </div>
    </div>
  </section>
</template>
