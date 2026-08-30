import { openAppDatabase } from '../indexedDb/database.js'
import { requestResult, transactionComplete } from '../indexedDb/transactions.js'
import { getBodyTrackerData } from './bodyRepository.js'
import { getExerciseCatalog } from './catalogRepository.js'

export async function getAnalyticsData() {
  const bodyTracker = await getBodyTrackerData()
  const catalog = await getExerciseCatalog()
  const database = await openAppDatabase()
  const transaction = database.transaction(
    ['workoutSets', 'bodyWeights', 'measurementRecords', 'workoutTimes'],
    'readonly',
  )
  const done = transactionComplete(transaction)
  const results = await Promise.all([
    requestResult(transaction.objectStore('workoutSets').getAll()),
    requestResult(transaction.objectStore('bodyWeights').getAll()),
    requestResult(transaction.objectStore('measurementRecords').getAll()),
    requestResult(transaction.objectStore('workoutTimes').getAll()),
  ])
  await done

  return {
    bodyMeasurements: buildBodyMeasurements(bodyTracker.measurements, results[1], results[2]),
    categories: catalog.categories,
    exercises: catalog.exercises,
    workoutSets: results[0] ?? [],
    workoutTimes: results[3] ?? [],
  }
}

function buildBodyMeasurements(items, bodyWeights, measurementRecords) {
  const measurements = []

  for (const item of items) {
    measurements.push({
      ...item,
      records: buildBodyHistory(item, bodyWeights, measurementRecords),
    })
  }

  return measurements
}

function buildBodyHistory(item, bodyWeights, measurementRecords) {
  const records = item.sourceType === 'bodyWeight'
    ? buildBodyWeightHistory(item, bodyWeights)
    : buildMeasurementHistory(item, measurementRecords)

  records.sort(compareRecords)
  return records
}

function buildBodyWeightHistory(item, bodyWeights) {
  const records = []

  for (const row of bodyWeights ?? []) {
    const value = Number(row[item.sourceField])
    if (!row.date || !Number.isFinite(value)) continue
    records.push(createBodyRecord(row, value))
  }

  return records
}

function buildMeasurementHistory(item, measurementRecords) {
  const records = []

  for (const row of measurementRecords ?? []) {
    const value = Number(row.value)
    if (row.measurementId !== item.sourceId || !row.date || !Number.isFinite(value)) continue
    records.push(createBodyRecord(row, value))
  }

  return records
}

function createBodyRecord(row, value) {
  return {
    id: row.id,
    date: String(row.date),
    time: String(row.time ?? '00:00:00'),
    value,
  }
}

function compareRecords(first, second) {
  const dateComparison = first.date.localeCompare(second.date)
  if (dateComparison !== 0) return dateComparison

  const timeComparison = first.time.localeCompare(second.time)
  if (timeComparison !== 0) return timeComparison
  return String(first.id).localeCompare(String(second.id))
}
