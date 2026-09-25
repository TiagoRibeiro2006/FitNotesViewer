import { copyWorkoutDay } from '../../../data/repositories/workoutRepository'
import { createEmptySummary } from '../../../shared/models/summary'

export async function copyWorkoutToDate(sourceDate, targetDate) {
  return await copyWorkoutDay(sourceDate, targetDate) ?? createEmptySummary()
}
