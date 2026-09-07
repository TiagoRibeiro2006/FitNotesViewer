import { analyzeBodyWeight } from '../../../ai/body/analyzeBodyWeight.js'
import {
  getBodyMeasurementHistory,
  getBodyTrackerData,
} from '../../../data/repositories/bodyRepository.js'

export async function analyzeStoredBodyWeight(goal) {
  const tracker = await getBodyTrackerData()
  const bodyWeight = findBodyWeight(tracker.measurements)
  if (!bodyWeight) return analyzeBodyWeight([], goal)

  const records = await getBodyMeasurementHistory(bodyWeight)
  return analyzeBodyWeight(records, goal)
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
