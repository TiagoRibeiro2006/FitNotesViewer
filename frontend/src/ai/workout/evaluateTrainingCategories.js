import { evaluateBodyRegionBalance } from './utils/bodyRegionBalance.js'

const CATEGORY_LEVELS = [
  { minimumScore: 8, level: 'great' },
  { minimumScore: 6, level: 'average' },
  { minimumScore: 3, level: 'bad' },
  { minimumScore: 0, level: 'terrible' },
]

export function evaluateTrainingCategories(analysis, periodDays) {
  if (!analysis?.totalSets || !analysis?.workoutCount) {
    return createEmptyCategories()
  }

  return [
    evaluateFrequency(analysis, periodDays),
    evaluateBodyBalance(analysis, periodDays),
    evaluateWorkoutConsistency(analysis.workouts),
    evaluateExerciseConsistency(analysis.consistency?.exercises),
    evaluateSetConsistency(analysis.consistency?.sets),
    evaluateMuscleDistribution(analysis.muscles),
  ]
}

function evaluateFrequency(analysis, periodDays) {
  const workoutsPerWeek = analysis.workoutCount / calculateWeeks(periodDays)
  let score = 2

  if (workoutsPerWeek > 6) score = 7
  else if (workoutsPerWeek >= 2.5) score = 10
  else if (workoutsPerWeek >= 2) score = 8
  else if (workoutsPerWeek >= 1.5) score = 6
  else if (workoutsPerWeek >= 1) score = 4

  return createCategory(
    'frequency',
    'Frequency',
    score,
    formatNumber(workoutsPerWeek) + ' workout days per week.',
  )
}

function evaluateBodyBalance(analysis, periodDays) {
  const balance = evaluateBodyRegionBalance(analysis.regions, periodDays)
  const score = bodyBalanceScore(balance.status)
  const weeks = calculateWeeks(periodDays)
  const upperPerWeek = balance.upperFrequency / weeks
  const lowerPerWeek = balance.lowerFrequency / weeks
  const summary = 'Upper ' + formatNumber(upperPerWeek)
    + '× and lower ' + formatNumber(lowerPerWeek) + '× per week.'

  return createCategory('body-balance', 'Body balance', score, summary)
}

function bodyBalanceScore(status) {
  if (status === 'balanced') return 10
  if (status === 'uneven') return 6
  if (status === 'unbalanced') return 3
  if (status === 'missing-upper' || status === 'missing-lower') return 1
  return 0
}

function evaluateWorkoutConsistency(workouts) {
  if (!Array.isArray(workouts) || workouts.length < 2) {
    return createCategory(
      'workout-consistency',
      'Workout consistency',
      5,
      'More than one workout is needed for a reliable comparison.',
    )
  }

  const totals = readWorkoutTotals(workouts)
  const average = calculateAverage(totals)
  const spread = calculateWorkoutSpread(totals, average)
  const score = workoutConsistencyScore(spread)
  const percentage = Math.round(spread * 100)

  return createCategory(
    'workout-consistency',
    'Workout consistency',
    score,
    'Smallest-to-largest set difference was ' + percentage + '% of the average workout.',
  )
}

function calculateWorkoutSpread(totals, average) {
  if (!average || !totals.length) return 0

  let minimum = totals[0]
  let maximum = totals[0]
  for (const total of totals) {
    minimum = Math.min(minimum, total)
    maximum = Math.max(maximum, total)
  }

  return (maximum - minimum) / average
}

function readWorkoutTotals(workouts) {
  const totals = []
  for (const workout of workouts) totals.push(Number(workout.totalSets) || 0)
  return totals
}

function calculateAverage(values) {
  let total = 0
  for (const value of values) total += value
  return values.length ? total / values.length : 0
}

function workoutConsistencyScore(spread) {
  if (spread <= 0.2) return 10
  if (spread <= 0.4) return 9
  if (spread <= 0.65) return 7
  if (spread <= 0.85) return 5
  if (spread <= 1) return 3
  return 1
}

function evaluateExerciseConsistency(metrics) {
  if (!Number.isFinite(metrics?.repeatRate)) {
    return createCategory(
      'exercise-consistency',
      'Exercise consistency',
      5,
      'Repeat a muscle in another workout to measure exercise selection.',
    )
  }

  const percentage = Math.round(metrics.repeatRate * 100)
  const score = Math.round(metrics.repeatRate * 10)
  return createCategory(
    'exercise-consistency',
    'Exercise consistency',
    score,
    percentage + '% of comparable exercise appearances were repeated.',
  )
}

function evaluateSetConsistency(metrics) {
  if (!Number.isFinite(metrics?.stability)) {
    return createCategory(
      'set-consistency',
      'Set consistency',
      5,
      'Repeat an exercise to compare its number of sets.',
    )
  }

  const percentage = Math.round(metrics.stability * 100)
  const score = Math.round(metrics.stability * 10)
  return createCategory(
    'set-consistency',
    'Set consistency',
    score,
    'Set counts were ' + percentage + '% stable across repeated exercises.',
  )
}

function evaluateMuscleDistribution(muscles) {
  const leadingMuscle = findLeadingMuscle(muscles)
  if (!leadingMuscle) {
    return createCategory('muscle-distribution', 'Muscle distribution', 0, 'No sets to compare.')
  }

  const score = muscleDistributionScore(leadingMuscle.distribution)
  const summary = leadingMuscle.name + ' received '
    + formatNumber(leadingMuscle.distribution) + '% of all sets.'

  return createCategory('muscle-distribution', 'Muscle distribution', score, summary)
}

function findLeadingMuscle(muscles) {
  let leadingMuscle = null

  for (const [name, metrics] of Object.entries(muscles ?? {})) {
    if (!leadingMuscle || metrics.distribution > leadingMuscle.distribution) {
      leadingMuscle = { name, distribution: metrics.distribution }
    }
  }

  return leadingMuscle
}

function muscleDistributionScore(distribution) {
  if (distribution <= 30) return 10
  if (distribution <= 45) return 9
  if (distribution <= 55) return 7
  if (distribution <= 70) return 5
  if (distribution <= 85) return 3
  return 1
}

function createEmptyCategories() {
  const summary = 'No completed sets in the selected period.'
  return [
    createCategory('frequency', 'Frequency', 0, summary),
    createCategory('body-balance', 'Body balance', 0, summary),
    createCategory('workout-consistency', 'Workout consistency', 0, summary),
    createCategory('exercise-consistency', 'Exercise consistency', 0, summary),
    createCategory('set-consistency', 'Set consistency', 0, summary),
    createCategory('muscle-distribution', 'Muscle distribution', 0, summary),
  ]
}

function createCategory(id, label, score, summary) {
  const normalizedScore = normalizeScore(score)
  return {
    id,
    label,
    score: normalizedScore,
    level: findCategoryLevel(normalizedScore),
    summary,
  }
}

function normalizeScore(score) {
  const value = Number(score)
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(10, Math.round(value)))
}

function findCategoryLevel(score) {
  for (const categoryLevel of CATEGORY_LEVELS) {
    if (score >= categoryLevel.minimumScore) return categoryLevel.level
  }
  return 'terrible'
}

function calculateWeeks(periodDays) {
  const days = Number(periodDays)
  if (!Number.isFinite(days) || days <= 7) return 1
  return days / 7
}

function formatNumber(value) {
  return Number(value).toFixed(1).replace('.0', '')
}
