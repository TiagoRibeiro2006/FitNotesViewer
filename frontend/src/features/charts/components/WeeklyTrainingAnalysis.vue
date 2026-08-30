<script setup>
import { computed } from 'vue'
import { analyzeWeeklyTraining } from '../../../ai/workout/analyzeWeeklyTraining.js'
import { buildLatestWeeklyWorkouts } from '../analytics/weeklyWorkoutInput.js'

const props = defineProps({
  sets: { type: Array, required: true },
})

const workouts = computed(buildWorkouts)
const analysis = computed(buildAnalysis)
const muscles = computed(buildMuscleRows)

function buildWorkouts() {
  return buildLatestWeeklyWorkouts(props.sets)
}

function buildAnalysis() {
  return analyzeWeeklyTraining(workouts.value)
}

function buildMuscleRows() {
  const rows = []

  for (const [name, metrics] of Object.entries(analysis.value.muscles)) {
    rows.push({ name, ...metrics })
  }

  rows.sort(compareMuscles)
  return rows
}

function compareMuscles(first, second) {
  return second.totalSets - first.totalSets || first.name.localeCompare(second.name)
}

function distributionStyle(muscle) {
  return { width: `${muscle.distribution}%` }
}

function formatWorkoutDate(dateKey) {
  const parts = String(dateKey).split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function setLabel(value) {
  return value === 1 ? '1 set' : `${value} sets`
}

function workoutLabel(value) {
  return value === 1 ? '1 workout' : `${value} workouts`
}
</script>

<template>
  <section class="chart-visual-card weekly-analysis-card">
    <div class="chart-card-heading training-chart-heading weekly-analysis-heading">
      <div>
        <p class="eyebrow">AI WEEKLY ANALYSIS</p>
        <h2>Your latest training week</h2>
      </div>
      <span class="weekly-analysis-badge">On device</span>
    </div>

    <div v-if="analysis.totalSets" class="weekly-analysis-content">
      <div class="weekly-analysis-summary">
        <article>
          <span>Total sets</span>
          <strong>{{ analysis.totalSets }}</strong>
          <small>Across the latest week</small>
        </article>
        <article>
          <span>Workout days</span>
          <strong>{{ analysis.workoutCount }}</strong>
          <small>{{ setLabel(analysis.totalSets) }} completed</small>
        </article>
      </div>

      <div class="weekly-analysis-details">
        <section class="weekly-analysis-section">
          <div class="weekly-analysis-section-title">
            <span>Muscle breakdown</span>
            <small>{{ muscles.length }} trained</small>
          </div>

          <div class="weekly-muscle-list">
            <article v-for="muscle in muscles" :key="muscle.name">
              <div class="weekly-muscle-heading">
                <strong>{{ muscle.name }}</strong>
                <span>{{ muscle.distribution }}%</span>
              </div>
              <div class="weekly-muscle-track">
                <i :style="distributionStyle(muscle)"></i>
              </div>
              <small>{{ setLabel(muscle.totalSets) }} · {{ workoutLabel(muscle.frequency) }}</small>
            </article>
          </div>
        </section>

        <section class="weekly-analysis-section">
          <div class="weekly-analysis-section-title">
            <span>Workout activity</span>
            <small>{{ analysis.workoutCount }} days</small>
          </div>

          <div class="weekly-workout-list">
            <article v-for="workout in analysis.workouts" :key="workout.date">
              <span>{{ formatWorkoutDate(workout.date) }}</span>
              <strong>{{ setLabel(workout.totalSets) }}</strong>
            </article>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="weekly-analysis-empty">
      <strong>No weekly training data</strong>
      <p>Add sets in the Log to generate this analysis.</p>
    </div>
  </section>
</template>
