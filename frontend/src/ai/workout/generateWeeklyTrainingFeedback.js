export function generateWeeklyTrainingFeedback(analysis) {
  if (!analysis?.totalSets || !analysis?.workoutCount) return emptyWeekFeedback()

  const muscles = readMuscles(analysis.muscles)
  const paragraphs = [buildWeekSummary(analysis), buildMuscleSummary(muscles)]
  const improvement = buildImprovement(analysis, muscles)

  if (improvement) paragraphs.push(improvement)
  return paragraphs.filter(Boolean).join('\n\n')
}

function emptyWeekFeedback() {
  return 'There is not enough training data for a weekly review yet. Add some completed sets and the analysis will describe your training here.'
}

function buildWeekSummary(analysis) {
  const workoutText = pluralize(analysis.workoutCount, 'workout day')
  const setText = pluralize(analysis.totalSets, 'set')
  const busiestWorkout = readBusiestWorkout(analysis.workouts)

  let summary = `You completed ${setText} across ${workoutText} in your latest training week.`
  if (analysis.workoutCount > 1 && busiestWorkout) {
    summary += ` Your busiest workout contained ${pluralize(busiestWorkout.totalSets, 'set')}.`
  }
  return summary
}

function buildMuscleSummary(muscles) {
  const leadingMuscle = muscles[0]
  if (!leadingMuscle) return ''

  const tiedMuscleCount = countLeadingMuscles(muscles, leadingMuscle.totalSets)
  if (tiedMuscleCount > 1) {
    return `Your highest set count was shared by ${tiedMuscleCount} muscle groups, with ${pluralize(leadingMuscle.totalSets, 'set')} each. This indicates that no single muscle dominated the week.`
  }

  const frequency = pluralize(leadingMuscle.frequency, 'workout')
  const sets = pluralize(leadingMuscle.totalSets, 'set')
  return `${leadingMuscle.name} was your main focus with ${sets} across ${frequency}, representing ${formatPercentage(leadingMuscle.distribution)} of your weekly sets.`
}

function countLeadingMuscles(muscles, leadingSetCount) {
  let count = 0
  for (const muscle of muscles) {
    if (muscle.totalSets === leadingSetCount) count += 1
  }
  return count
}

function buildImprovement(analysis, muscles) {
  if (analysis.workoutCount === 1) {
    return 'This week contains only one workout. If consistency is one of your goals, adding another training day would give you a more regular weekly rhythm.'
  }

  if (muscles.length === 1) {
    return `All logged sets targeted ${muscles[0].name}. That can suit a focused week, but consider adding another muscle group if you want a more balanced routine.`
  }

  if (muscles[0].distribution > 50) {
    return `${muscles[0].name} accounted for more than half of the work. If that emphasis was not intentional, distribute a few sets towards the less-trained muscle groups next week.`
  }

  if (hasUnevenWorkoutLoads(analysis.workouts)) {
    return 'Your workload varied noticeably between workout days. Spreading sets more evenly may make the week easier to manage and repeat.'
  }

  const infrequentMuscles = readInfrequentMuscles(muscles)
  if (infrequentMuscles.length) {
    return `${formatMuscleNames(infrequentMuscles)} appeared in only one workout. If progressing those muscles is a priority, consider training them more than once during the week.`
  }

  return 'Your training was consistent and the weekly workload was reasonably well distributed. There is no obvious adjustment needed from these data alone.'
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

function readInfrequentMuscles(muscles) {
  const names = []
  for (const muscle of muscles) {
    if (muscle.frequency === 1) names.push(muscle.name)
  }
  return names.slice(0, 3)
}

function formatMuscleNames(names) {
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names[0]}, ${names[1]} and ${names[2]}`
}

function formatPercentage(value) {
  return `${Number(value).toFixed(1).replace('.0', '')}%`
}

function pluralize(value, label) {
  return `${value} ${value === 1 ? label : `${label}s`}`
}
