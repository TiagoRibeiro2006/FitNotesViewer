import { evaluateBodyRegionBalance } from './utils/bodyRegionBalance.js'

const RATINGS = [
  { minimumScore: 80, level: 'great', label: 'Great' },
  { minimumScore: 60, level: 'average', label: 'Average' },
  { minimumScore: 35, level: 'bad', label: 'Bad' },
  { minimumScore: 0, level: 'terrible', label: 'Terrible' },
]
const RATING_LEVELS = ['terrible', 'bad', 'average', 'great']

export function evaluateTrainingPeriod(analysis, periodDays) {
  const score = calculateScore(analysis, periodDays)
  const scoreRating = findRating(score)
  const regionBalance = evaluateBodyRegionBalance(analysis?.regions)
  const maximumRating = findMaximumRating(regionBalance.status)
  const rating = limitRating(scoreRating, maximumRating)
  return { ...rating, score, regionBalance }
}

function calculateScore(analysis, periodDays) {
  if (!analysis?.totalSets || !analysis?.workoutCount) return 0

  const weeks = calculateWeeks(periodDays)
  const workoutsPerWeek = analysis.workoutCount / weeks
  const setsPerWeek = analysis.totalSets / weeks

  return workoutScore(workoutsPerWeek)
    + setScore(setsPerWeek)
    + muscleVarietyScore(analysis.muscles)
    + muscleBalanceScore(analysis.muscles, analysis.totalSets)
    + workoutBalanceScore(analysis.workouts)
}

function calculateWeeks(periodDays) {
  const days = Number(periodDays)
  if (!Number.isFinite(days) || days <= 7) return 1
  return days / 7
}

function workoutScore(workoutsPerWeek) {
  if (workoutsPerWeek >= 3) return 35
  if (workoutsPerWeek >= 2) return 22
  return 8
}

function setScore(setsPerWeek) {
  if (setsPerWeek >= 10) return 20
  if (setsPerWeek >= 5) return 12
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

function findMaximumRating(balanceStatus) {
  if (balanceStatus === 'missing-both') return 'terrible'
  if (balanceStatus === 'missing-upper') return 'terrible'
  if (balanceStatus === 'missing-lower') return 'terrible'
  if (balanceStatus === 'unbalanced') return 'bad'
  if (balanceStatus === 'uneven') return 'average'
  return null
}

function limitRating(rating, maximumRating) {
  if (!maximumRating) return rating

  const ratingIndex = RATING_LEVELS.indexOf(rating.level)
  const maximumIndex = RATING_LEVELS.indexOf(maximumRating)
  if (ratingIndex <= maximumIndex) return rating
  return findRatingByLevel(maximumRating)
}

function findRatingByLevel(level) {
  for (const rating of RATINGS) {
    if (rating.level === level) {
      return { level: rating.level, label: rating.label }
    }
  }
  return { level: 'terrible', label: 'Terrible' }
}
