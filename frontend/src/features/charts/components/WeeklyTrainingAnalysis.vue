<script setup>
import { computed, ref, watch } from 'vue'
import { analyzeWeeklyTraining } from '../../../ai/workout/analyzeWeeklyTraining.js'
import { evaluateWeeklyTraining } from '../../../ai/workout/evaluateWeeklyTraining.js'
import { generateWeeklyTrainingFeedback } from '../../../ai/workout/generateWeeklyTrainingFeedback.js'
import {
  buildWeeklyWorkouts,
  findLatestWorkoutDate,
  readWorkoutWeekRange,
} from '../analytics/weeklyWorkoutInput.js'

const props = defineProps({
  sets: { type: Array, required: true },
})

const selectedDate = ref('')
const generatedDate = ref('')
const workouts = computed(buildWorkouts)
const analysis = computed(buildAnalysis)
const feedback = computed(buildFeedback)
const rating = computed(buildRating)
const ratingClass = computed(readRatingClass)
const generatedRange = computed(buildGeneratedRange)
const rangeLabel = computed(formatGeneratedRange)

watch(() => props.sets, resetDates, { immediate: true })

function buildWorkouts() {
  return buildWeeklyWorkouts(props.sets, generatedDate.value)
}

function buildAnalysis() {
  return analyzeWeeklyTraining(workouts.value)
}

function buildFeedback() {
  return generateWeeklyTrainingFeedback(analysis.value)
}

function buildRating() {
  return evaluateWeeklyTraining(analysis.value)
}

function readRatingClass() {
  return `is-${rating.value.level}`
}

function buildGeneratedRange() {
  return readWorkoutWeekRange(generatedDate.value)
}

function resetDates() {
  const latestDate = findLatestWorkoutDate(props.sets)
  if (!latestDate) return
  selectedDate.value = latestDate
  generatedDate.value = latestDate
}

function generateAnalysis() {
  if (!readWorkoutWeekRange(selectedDate.value)) return
  generatedDate.value = selectedDate.value
}

function formatGeneratedRange() {
  if (!generatedRange.value) return 'No week selected'
  const startDate = formatDate(generatedRange.value.startDate)
  const endDate = formatDate(generatedRange.value.endDate)
  return `${startDate} – ${endDate}`
}

function formatDate(dateKey) {
  const parts = dateKey.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
</script>

<template>
  <section class="chart-visual-card weekly-analysis-card" :class="ratingClass">
    <div class="chart-card-heading training-chart-heading weekly-analysis-heading">
      <div>
        <p class="eyebrow">AI WEEKLY ANALYSIS</p>
        <h2>What your training shows</h2>
      </div>
    </div>

    <div class="weekly-analysis-status">
      <span class="weekly-analysis-badge">{{ rating.label }}</span>
      <span class="weekly-analysis-range">{{ rangeLabel }}</span>
    </div>

    <form class="weekly-analysis-controls" @submit.prevent="generateAnalysis">
      <label>
        <span>Select a day in the week</span>
        <input v-model="selectedDate" type="date" required>
      </label>
      <button type="submit">Generate</button>
    </form>

    <div class="weekly-analysis-report">
      <p>{{ feedback }}</p>
      <small>Generated locally from the selected training week.</small>
    </div>
  </section>
</template>
