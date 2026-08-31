<script setup>
import { computed } from 'vue'
import { analyzeWeeklyTraining } from '../../../ai/workout/analyzeWeeklyTraining.js'
import { generateWeeklyTrainingFeedback } from '../../../ai/workout/generateWeeklyTrainingFeedback.js'
import { buildLatestWeeklyWorkouts } from '../analytics/weeklyWorkoutInput.js'

const props = defineProps({
  sets: { type: Array, required: true },
})

const workouts = computed(buildWorkouts)
const analysis = computed(buildAnalysis)
const feedback = computed(buildFeedback)

function buildWorkouts() {
  return buildLatestWeeklyWorkouts(props.sets)
}

function buildAnalysis() {
  return analyzeWeeklyTraining(workouts.value)
}

function buildFeedback() {
  return generateWeeklyTrainingFeedback(analysis.value)
}
</script>

<template>
  <section class="chart-visual-card weekly-analysis-card">
    <div class="chart-card-heading training-chart-heading weekly-analysis-heading">
      <div>
        <p class="eyebrow">AI WEEKLY ANALYSIS</p>
        <h2>What your training shows</h2>
      </div>
      <span class="weekly-analysis-badge">On device</span>
    </div>

    <div class="weekly-analysis-report">
      <p>{{ feedback }}</p>
      <small>Generated locally from your latest training week.</small>
    </div>
  </section>
</template>
