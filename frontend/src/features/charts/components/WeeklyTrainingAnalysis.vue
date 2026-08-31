<script setup>
import { computed } from 'vue'
import { analyzeWeeklyTraining } from '../../../ai/workout/analyzeWeeklyTraining.js'
import { evaluateWeeklyTraining } from '../../../ai/workout/evaluateWeeklyTraining.js'
import { generateWeeklyTrainingFeedback } from '../../../ai/workout/generateWeeklyTrainingFeedback.js'
import { buildLatestWeeklyWorkouts } from '../analytics/weeklyWorkoutInput.js'

const props = defineProps({
  sets: { type: Array, required: true },
})

const workouts = computed(buildWorkouts)
const analysis = computed(buildAnalysis)
const feedback = computed(buildFeedback)
const rating = computed(buildRating)
const ratingClass = computed(readRatingClass)

function buildWorkouts() {
  return buildLatestWeeklyWorkouts(props.sets)
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
</script>

<template>
  <section class="chart-visual-card weekly-analysis-card" :class="ratingClass">
    <div class="chart-card-heading training-chart-heading weekly-analysis-heading">
      <div>
        <p class="eyebrow">AI WEEKLY ANALYSIS</p>
        <h2>What your training shows</h2>
      </div>
      <span class="weekly-analysis-badge">{{ rating.label }}</span>
    </div>

    <div class="weekly-analysis-report">
      <p>{{ feedback }}</p>
      <small>Generated locally from your latest training week.</small>
    </div>
  </section>
</template>
