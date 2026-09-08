import { analyzeBodyWeight } from '../../../ai/body/analyzeBodyWeight.js'
import {
  getBodyMeasurementHistory,
  getBodyTrackerData,
} from '../../../data/repositories/bodyRepository.js'
import { filterByDateInterval } from '../../charts/analytics/dateRanges.js'

export async function analyzeStoredBodyWeight(goal, startDate, endDate) {
  const tracker = await getBodyTrackerData()
  const bodyWeight = findBodyWeight(tracker.measurements)
  if (!bodyWeight) return analyzeBodyWeight([], goal)

  const records = await getBodyMeasurementHistory(bodyWeight)
  const selectedRecords = filterByDateInterval(records, startDate, endDate)
  return analyzeBodyWeight(selectedRecords, goal)
}

function findBodyWeight(measurements) {
  for (const measurement of measurements ?? []) {
    if (isBodyWeightSource(measurement)) return measurement
  }

  for (const measurement of measurements ?? []) {
    if (normalizeName(measurement?.name) === 'bodyweight') return measurement
  }

  return null
}

function isBodyWeightSource(measurement) {
  return measurement?.sourceType === 'bodyWeight'
    && measurement?.sourceField === 'bodyWeightMetric'
}

function normalizeName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}
