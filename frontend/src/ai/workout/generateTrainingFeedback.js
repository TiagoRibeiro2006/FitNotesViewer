import { evaluateBodyRegionBalance } from './utils/bodyRegionBalance.js'
import { calculatePeriodWeeks } from './utils/trainingPeriod.js'

export function generateTrainingFeedback(analysis, periodDays) {
  const paragraphs = []
  if (isSmallRange(periodDays)) paragraphs.push(smallRangeFeedback())

  if (!analysis?.totalSets || !analysis?.workoutCount) {
    paragraphs.push(emptyPeriodFeedback())
    return paragraphs.join('\n\n')
  }

  const muscles = readMuscles(analysis.muscles)
  paragraphs.push(buildPeriodSummary(analysis, periodDays))
  paragraphs.push(buildMuscleSummary(muscles))
  const improvement = buildImprovement(analysis, muscles, periodDays)

  if (improvement) paragraphs.push(improvement)
  return paragraphs.filter(Boolean).join('\n\n')
}

function isSmallRange(periodDays) {
  return Number(periodDays) < 6
}

function smallRangeFeedback() {
  return 'The range is small, so this review may not be fully accurate. Select at least 6 days for a more reliable view of your training balance.'
}

function emptyPeriodFeedback() {
  return 'There is not enough training data for this period yet. Add some completed sets or choose a different date range.'
}

function buildPeriodSummary(analysis, periodDays) {
  const workoutText = pluralize(analysis.workoutCount, 'workout day')
  const setText = pluralize(analysis.totalSets, 'set')
  const busiestWorkout = readBusiestWorkout(analysis.workouts)
  const workoutsPerWeek = calculateWeeklyAverage(analysis.workoutCount, periodDays)

  let summary = 'You completed ' + setText + ' across ' + workoutText + ' in the selected training period.'
  if (periodDays > 7) {
    summary += ' That is an average of ' + formatNumber(workoutsPerWeek) + ' workouts per week.'
  }
  if (analysis.workoutCount > 1 && busiestWorkout) {
    summary += ' Your busiest workout contained ' + pluralize(busiestWorkout.totalSets, 'set') + '.'
  }
  return summary
}

function buildMuscleSummary(muscles) {
  const leadingMuscle = muscles[0]
  if (!leadingMuscle) return ''

  const tiedMuscleCount = countLeadingMuscles(muscles, leadingMuscle.totalSets)
  if (tiedMuscleCount > 1) {
    return 'Your highest set count was shared by '
      + tiedMuscleCount
      + ' muscle groups, with '
      + pluralize(leadingMuscle.totalSets, 'set')
      + ' each. This indicates that no single muscle dominated the period.'
  }

  const frequency = pluralize(leadingMuscle.frequency, 'workout')
  const sets = pluralize(leadingMuscle.totalSets, 'set')
  return leadingMuscle.name
    + ' was your main focus with '
    + sets
    + ' across '
    + frequency
    + ', representing '
    + formatPercentage(leadingMuscle.distribution)
    + ' of your sets.'
}

function countLeadingMuscles(muscles, leadingSetCount) {
  let count = 0
  for (const muscle of muscles) {
    if (muscle.totalSets === leadingSetCount) count += 1
  }
  return count
}

function buildImprovement(analysis, muscles, periodDays) {
  const regionBalance = evaluateBodyRegionBalance(analysis.regions, periodDays)
  const regionImprovement = buildRegionImprovement(regionBalance)
  if (regionImprovement) return regionImprovement

  const workoutsPerWeek = calculateWeeklyAverage(analysis.workoutCount, periodDays)

  if (workoutsPerWeek < 1.5) {
    return 'Your training frequency was low for this period. If consistency is one of your goals, adding another weekly training day would create a more regular rhythm.'
  }

  const exerciseConsistencyFeedback = buildExerciseConsistencyFeedback(
    analysis.consistency?.exercises,
  )
  if (exerciseConsistencyFeedback) return exerciseConsistencyFeedback

  const setConsistencyFeedback = buildSetConsistencyFeedback(analysis.consistency?.sets)
  if (setConsistencyFeedback) return setConsistencyFeedback

  if (muscles.length === 1) {
    return 'All logged sets targeted '
      + muscles[0].name
      + '. That can suit a focused period, but consider adding another muscle group if you want a more balanced routine.'
  }

  if (muscles[0].distribution > 50) {
    return muscles[0].name
      + ' accounted for more than half of the work. If that emphasis was not intentional, distribute a few sets towards the less-trained muscle groups in your next training period.'
  }

  if (hasUnevenWorkoutLoads(analysis.workouts)) {
    return 'Your workload varied noticeably between workout days. Spreading sets more evenly may make your training easier to manage and repeat.'
  }

  return 'Your training was consistent and the workload was reasonably well distributed. There is no obvious adjustment needed from these data alone.'
}

function buildExerciseConsistencyFeedback(metrics) {
  if (!Number.isFinite(metrics?.repeatRate) || metrics.repeatRate > 0.4) return ''

  const percentage = Math.round(metrics.repeatRate * 100)
  return 'Only '
    + percentage
    + '% of comparable exercise appearances were repeated. Keeping a small core of exercises for each muscle would make progress easier to measure.'
}

function buildSetConsistencyFeedback(metrics) {
  if (!Number.isFinite(metrics?.stability) || metrics.stability >= 0.6) return ''

  const percentage = Math.round(metrics.stability * 100)
  return 'Set counts were '
    + percentage
    + '% stable across repeated exercises. A more consistent number of working sets would make your workload easier to compare and manage.'
}

function buildRegionImprovement(balance) {
  if (balance.status === 'missing-both') {
    return 'No major upper- or lower-body work was logged. A complete routine should include both regions instead of relying only on smaller accessory muscles.'
  }
  if (balance.status === 'missing-upper') {
    return 'No major upper-body work was logged. Add upper-body training to avoid leaving half of the body untrained.'
  }
  if (balance.status === 'missing-lower') {
    return 'No major lower-body work was logged. Add lower-body training to avoid leaving half of the body untrained.'
  }
  if (balance.status === 'unbalanced') {
    return buildRegionFrequencyFeedback(balance, 'The gap is large enough to make the routine unbalanced.')
  }
  if (balance.status === 'uneven') {
    return buildRegionFrequencyFeedback(balance, 'The frequencies are close, but could be more even.')
  }
  return ''
}

function buildRegionFrequencyFeedback(balance, conclusion) {
  return 'Upper body appeared in '
    + pluralize(balance.upperFrequency, 'workout')
    + ', while lower body appeared in '
    + pluralize(balance.lowerFrequency, 'workout')
    + '. '
    + conclusion
}

function calculateWeeklyAverage(value, periodDays) {
  return value / calculatePeriodWeeks(periodDays)
}

function readMuscles(muscleMetrics) {
  const muscles = []

  for (const [name, metrics] of Object.entries(muscleMetrics ?? {})) {
    muscles.push({ name, ...metrics })
  }

  muscles.sort(compareMuscles)
  return muscles
}

function compareMuscles(first, second) {
  return second.totalSets - first.totalSets || first.name.localeCompare(second.name)
}

function readBusiestWorkout(workouts) {
  let busiestWorkout = null

  for (const workout of workouts ?? []) {
    if (!busiestWorkout || workout.totalSets > busiestWorkout.totalSets) busiestWorkout = workout
  }

  return busiestWorkout
}

function hasUnevenWorkoutLoads(workouts) {
  if (!Array.isArray(workouts) || workouts.length < 2) return false

  let minimum = workouts[0].totalSets
  let maximum = workouts[0].totalSets

  for (const workout of workouts) {
    minimum = Math.min(minimum, workout.totalSets)
    maximum = Math.max(maximum, workout.totalSets)
  }

  return maximum - minimum >= 4 && maximum >= minimum * 2
}

function formatPercentage(value) {
  return Number(value).toFixed(1).replace('.0', '') + '%'
}

function formatNumber(value) {
  return Number(value).toFixed(1).replace('.0', '')
}

function pluralize(value, label) {
  return value + ' ' + (value === 1 ? label : label + 's')
}
