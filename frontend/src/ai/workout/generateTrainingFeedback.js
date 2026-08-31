export function generateTrainingFeedback(analysis, periodDays) {
  if (!analysis?.totalSets || !analysis?.workoutCount) return emptyPeriodFeedback()

  const muscles = readMuscles(analysis.muscles)
  const paragraphs = [buildPeriodSummary(analysis, periodDays), buildMuscleSummary(muscles)]
  const improvement = buildImprovement(analysis, muscles, periodDays)

  if (improvement) paragraphs.push(improvement)
  return paragraphs.filter(Boolean).join('\n\n')
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
  const workoutsPerWeek = calculateWeeklyAverage(analysis.workoutCount, periodDays)

  if (workoutsPerWeek < 1.5) {
    return 'Your training frequency was low for this period. If consistency is one of your goals, adding another weekly training day would create a more regular rhythm.'
  }

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

  const infrequentMuscles = readInfrequentMuscles(muscles, periodDays)
  if (infrequentMuscles.length) {
    return formatMuscleNames(infrequentMuscles)
      + ' appeared infrequently. If progressing those muscles is a priority, consider training them more consistently.'
  }

  return 'Your training was consistent and the workload was reasonably well distributed. There is no obvious adjustment needed from these data alone.'
}

function calculateWeeklyAverage(value, periodDays) {
  const days = Number(periodDays)
  const weeks = Number.isFinite(days) && days > 7 ? days / 7 : 1
  return value / weeks
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

function readInfrequentMuscles(muscles, periodDays) {
  const names = []

  for (const muscle of muscles) {
    if (calculateWeeklyAverage(muscle.frequency, periodDays) <= 1) names.push(muscle.name)
  }

  return names.slice(0, 3)
}

function formatMuscleNames(names) {
  if (names.length === 1) return names[0]
  if (names.length === 2) return names[0] + ' and ' + names[1]
  return names[0] + ', ' + names[1] + ' and ' + names[2]
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
