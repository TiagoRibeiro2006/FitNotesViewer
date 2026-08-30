<script setup>
import { computed } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers.js'

const props = defineProps({
  analytics: { type: Object, required: true },
})

const leadingMuscle = computed(readLeadingMuscle)
const leadingExercise = computed(readLeadingExercise)
const favouriteDay = computed(readFavouriteDay)
const balance = computed(readBalance)

function readLeadingMuscle() {
  return props.analytics.muscleDistribution[0] ?? null
}

function readLeadingExercise() {
  const ranking = [...props.analytics.exerciseRanking]
  ranking.sort(compareExerciseSets)
  return ranking[0] ?? null
}

function readFavouriteDay() {
  const days = [...props.analytics.weekdayDistribution]
  days.sort(compareWeekdays)
  return days[0]?.workouts ? days[0] : null
}

function readBalance() {
  if (!leadingMuscle.value || !props.analytics.totalSets) return null
  const percentage = (leadingMuscle.value.sets / props.analytics.totalSets) * 100
  let label = 'Well distributed'
  if (percentage >= 45) label = 'Highly focused'
  else if (percentage >= 30) label = 'Moderately focused'
  return { label, percentage }
}

function compareExerciseSets(first, second) {
  return second.sets - first.sets
}

function compareWeekdays(first, second) {
  return second.workouts - first.workouts || first.id - second.id
}

function formatVolumePerWorkout() {
  if (!props.analytics.workoutCount) return '—'
  const volume = props.analytics.totalVolume / props.analytics.workoutCount
  return `${compactNumber(volume)} kg`
}

function compactNumber(value) {
  if (Math.abs(value) < 10000) return formatNumber(value)
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
</script>

<template>
  <section class="chart-visual-card training-insights-card">
    <div class="chart-card-heading training-chart-heading">
      <div>
        <p class="eyebrow">QUICK READS</p>
        <h2>What stands out</h2>
      </div>
    </div>

    <div class="training-insights-grid">
      <article>
        <i :style="{ background: leadingMuscle?.color || '#3f96ff' }"></i>
        <span>Most trained muscle</span>
        <strong>{{ leadingMuscle?.name || '—' }}</strong>
        <small>{{ leadingMuscle ? `${leadingMuscle.sets} sets` : 'No data' }}</small>
      </article>
      <article>
        <i :style="{ background: leadingExercise?.color || '#8d75f5' }"></i>
        <span>Most used exercise</span>
        <strong>{{ leadingExercise?.name || '—' }}</strong>
        <small>{{ leadingExercise ? `${leadingExercise.sessions} workout days` : 'No data' }}</small>
      </article>
      <article>
        <i class="is-green"></i>
        <span>Favourite workout day</span>
        <strong>{{ favouriteDay?.label || '—' }}</strong>
        <small>{{ favouriteDay ? `${favouriteDay.workouts} workouts` : 'No data' }}</small>
      </article>
      <article>
        <i class="is-orange"></i>
        <span>Muscle balance</span>
        <strong>{{ balance?.label || '—' }}</strong>
        <small>{{ balance ? `${formatNumber(balance.percentage)}% on ${leadingMuscle.name}` : 'No data' }}</small>
      </article>
      <article>
        <i class="is-blue"></i>
        <span>Volume per workout</span>
        <strong>{{ formatVolumePerWorkout() }}</strong>
        <small>Average selected workload</small>
      </article>
    </div>
  </section>
</template>
