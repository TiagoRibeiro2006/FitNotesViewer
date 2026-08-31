const RATINGS = [
  { minimumScore: 80, level: 'great', label: 'Great' },
  { minimumScore: 60, level: 'average', label: 'Average' },
  { minimumScore: 35, level: 'bad', label: 'Bad' },
  { minimumScore: 0, level: 'terrible', label: 'Terrible' },
]

export function evaluateWeeklyTraining(analysis) {
  const score = calculateScore(analysis)
  const rating = findRating(score)
  return { ...rating, score }
}

function calculateScore(analysis) {
  if (!analysis?.totalSets || !analysis?.workoutCount) return 0

  return workoutScore(analysis.workoutCount)
    + setScore(analysis.totalSets)
    + muscleVarietyScore(analysis.muscles)
    + muscleBalanceScore(analysis.muscles, analysis.totalSets)
    + workoutBalanceScore(analysis.workouts)
}

function workoutScore(workoutCount) {
  if (workoutCount >= 3) return 35
  if (workoutCount === 2) return 22
  return 8
}

function setScore(totalSets) {
  if (totalSets >= 10) return 20
  if (totalSets >= 5) return 12
  return 5
}

function muscleVarietyScore(muscles) {
  const muscleCount = Object.keys(muscles ?? {}).length
  if (muscleCount >= 3) return 20
  if (muscleCount === 2) return 12
  return muscleCount === 1 ? 5 : 0
}

function muscleBalanceScore(muscles, totalSets) {
  const largestMuscleSetCount = readLargestMuscleSetCount(muscles)
  if (!largestMuscleSetCount || !totalSets) return 0

  const percentage = (largestMuscleSetCount / totalSets) * 100
  if (percentage <= 50) return 15
  if (percentage <= 60) return 10
  if (percentage <= 80) return 5
  return 0
}

function readLargestMuscleSetCount(muscles) {
  let largestSetCount = 0

  for (const metrics of Object.values(muscles ?? {})) {
    largestSetCount = Math.max(largestSetCount, metrics.totalSets)
  }

  return largestSetCount
}

function workoutBalanceScore(workouts) {
  if (!Array.isArray(workouts) || workouts.length < 2) return 5

  let minimum = workouts[0].totalSets
  let maximum = workouts[0].totalSets

  for (const workout of workouts) {
    minimum = Math.min(minimum, workout.totalSets)
    maximum = Math.max(maximum, workout.totalSets)
  }

  if (maximum - minimum >= 6 && maximum >= minimum * 2) return 2
  if (maximum - minimum >= 4 && maximum >= minimum * 2) return 5
  return 10
}

function findRating(score) {
  for (const rating of RATINGS) {
    if (score >= rating.minimumScore) {
      return { level: rating.level, label: rating.label }
    }
  }

  return { level: 'terrible', label: 'Terrible' }
}
