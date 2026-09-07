import { evaluateBodyWeightGoal } from './evaluateBodyWeightGoal.js'
import { generateBodyWeightFeedback } from './generateBodyWeightFeedback.js'
import { calculateBodyWeightTrend } from './metrics/bodyWeightTrend.js'

export function analyzeBodyWeight(records, goal) {
  const trend = calculateBodyWeightTrend(records)
  const rating = evaluateBodyWeightGoal(trend, goal)

  return {
    goal,
    ...trend,
    rating,
    feedback: generateBodyWeightFeedback(trend, rating, goal),
  }
}
