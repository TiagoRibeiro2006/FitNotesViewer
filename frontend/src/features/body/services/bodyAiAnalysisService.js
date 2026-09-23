import { analyzeBodyWeight } from '../../../ai/body/analyzeBodyWeight.js'
import {
  getBodyMeasurementHistory,
  getBodyWeightAssignmentState,
} from '../../../data/repositories/bodyRepository.js'
import { filterByDateInterval } from '../../charts/analytics/dateRanges.js'
import { convertWeight, KILOGRAMS } from '../../../shared/units/weightUnits.js'

export async function analyzeStoredBodyWeight(goal, startDate, endDate, weightUnit) {
  const assignment = await getBodyWeightAssignmentState()
  if (!assignment.bodyWeight) return analyzeBodyWeight([], goal, weightUnit)

  const records = await getBodyMeasurementHistory(assignment.bodyWeight)
  const selectedRecords = filterByDateInterval(records, startDate, endDate)
  const kilogramRecords = convertRecordsToKilograms(selectedRecords, assignment.bodyWeight.unit)
  return analyzeBodyWeight(kilogramRecords, goal, weightUnit)
}

function convertRecordsToKilograms(records, sourceUnit) {
  const result = []
  for (const record of records) {
    result.push({
      ...record,
      value: convertWeight(record.value, sourceUnit, KILOGRAMS),
    })
  }
  return result
}
