import { evaluateBodyRegionBalance } from './utils/bodyRegionBalance.js'
import { evaluateTrainingCategories } from './evaluateTrainingCategories.js'

const RATINGS = [
  { minimumScore: 80, level: 'great', label: 'Great' },
  { minimumScore: 60, level: 'average', label: 'Average' },
  { minimumScore: 35, level: 'bad', label: 'Bad' },
  { minimumScore: 0, level: 'terrible', label: 'Terrible' },
]
const RATING_LEVELS = ['terrible', 'bad', 'average', 'great']

export function evaluateTrainingPeriod(analysis, periodDays) {
  const categories = evaluateTrainingCategories(analysis, periodDays)
  const score = calculateScore(categories)
  const scoreRating = findRating(score)
  const regionBalance = evaluateBodyRegionBalance(analysis?.regions, periodDays)
  const maximumRating = findMaximumRating(regionBalance.status, categories)
  const rating = limitRating(scoreRating, maximumRating)
  return { ...rating, score, regionBalance, categories }
}

function calculateScore(categories) {
  if (!categories.length) return 0

  let total = 0
  for (const category of categories) total += category.score
  return Math.round((total / categories.length) * 10)
}

function findRating(score) {
  for (const rating of RATINGS) {
    if (score >= rating.minimumScore) {
      return { level: rating.level, label: rating.label }
    }
  }

  return { level: 'terrible', label: 'Terrible' }
}

function findMaximumRating(balanceStatus, categories) {
  if (balanceStatus === 'missing-both') return 'terrible'
  if (balanceStatus === 'missing-upper') return 'terrible'
  if (balanceStatus === 'missing-lower') return 'terrible'
  if (balanceStatus === 'unbalanced') return 'bad'
  if (balanceStatus === 'uneven') return 'average'
  if (hasPoorExerciseAndSetConsistency(categories)) return 'bad'
  if (hasPoorExerciseConsistency(categories)) return 'average'
  return null
}

function hasPoorExerciseAndSetConsistency(categories) {
  return readCategoryScore(categories, 'exercise-consistency') <= 2
    && readCategoryScore(categories, 'set-consistency') <= 3
}

function hasPoorExerciseConsistency(categories) {
  return readCategoryScore(categories, 'exercise-consistency') <= 2
}

function readCategoryScore(categories, categoryId) {
  for (const category of categories) {
    if (category.id === categoryId) return category.score
  }
  return 0
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
