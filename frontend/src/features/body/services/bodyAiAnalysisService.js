import { analyzeBodyWeight } from '../../../ai/body/analyzeBodyWeight.js'
import {
  getBodyMeasurementHistory,
  getBodyWeightAssignmentState,
} from '../../../data/repositories/bodyRepository.js'
import { filterByDateInterval } from '../../charts/analytics/dateRanges.js'

export async function analyzeStoredBodyWeight(goal, startDate, endDate) {
  const assignment = await getBodyWeightAssignmentState()
  if (!assignment.bodyWeight) return analyzeBodyWeight([], goal)

  const records = await getBodyMeasurementHistory(assignment.bodyWeight)
  const selectedRecords = filterByDateInterval(records, startDate, endDate)
  return analyzeBodyWeight(selectedRecords, goal)
}
