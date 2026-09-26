import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createFitNotesCsvExport } from '../src/fitnotes/createFitNotesCsvExport.js'
import { parseFitNotesCsv } from '../src/fitnotes/parseFitNotesCsv.js'

function sampleData() {
  return {
    exercises: [{ id: 1, name: 'Bench Press', categoryId: 1 }],
    categories: [{ id: 1, name: 'Chest' }],
    workoutSets: [{ id: 1, exerciseId: 1, date: '2026-09-15', weight: 80, reps: 8, distance: 0, durationSeconds: 0 }],
    measurementUnits: [
      { id: 2, type: 1, longName: 'Kilograms', shortName: 'kgs' },
      { id: 'body-unit-custom', type: 2, longName: 'Centimetres', shortName: 'cm' },
    ],
    measurements: [
      { id: 1, name: 'Bodyweight', unitId: 2, goalType: 0, goalValue: 0, custom: 0, enabled: 1, sortOrder: 0 },
      { id: 'body-measurement-waist', localBodyId: 'waist-custom', name: 'Waist Custom', unitId: 'body-unit-custom', goalType: 0, goalValue: 0, custom: 1, enabled: 1, sortOrder: 20 },
    ],
    measurementRecords: [
      { id: 193, measurementId: 1, date: '2026-08-28', time: '12:18:00', value: 65.9, comment: null },
      { id: 'local-body-record-new', measurementId: 1, date: '2026-09-16', time: '09:30:00', value: 66.2, comment: 'morning' },
      { id: 'local-waist', measurementId: 'body-measurement-waist', date: '2026-09-16', time: '09:31:00', value: 74.5, comment: null },
    ],
    bodyWeights: [
      { id: 'legacy-local', date: '2026-09-14', time: '08:00:00', bodyWeightMetric: 66.0, bodyFat: null, comments: 'legacy' },
    ],
  }
}

test('extended CSV preserves workout data and all body structures through export and reimport', () => {
  const csv = createFitNotesCsvExport(sampleData())
  const parsed = parseFitNotesCsv({ name: 'complete.csv' }, csv)

  assert.equal(parsed.workoutSets.length, 1)
  assert.equal(parsed.workoutSets[0].weight, 80)
  assert.equal(parsed.measurementUnits.length, 2)
  assert.equal(parsed.measurements.length, 2)
  assert.equal(parsed.measurementRecords.length, 3)
  assert.equal(parsed.bodyWeights.length, 1)

  const latestWeight = parsed.measurementRecords.find((record) => record.date === '2026-09-16' && record.measurementId === 1)
  assert.equal(latestWeight.value, 66.2)
  assert.equal(latestWeight.time, '09:30:00')
  assert.equal(latestWeight.comment, 'morning')

  const waist = parsed.measurements.find((measurement) => measurement.name === 'Waist Custom')
  assert.equal(waist.localBodyId, 'waist-custom')
  assert.equal(parsed.measurementRecords.find((record) => record.measurementId === waist.id).value, 74.5)
})

test('extended CSV can restore body data even when there are no workout rows', () => {
  const data = sampleData()
  data.workoutSets = []
  data.exercises = []
  data.categories = []
  const parsed = parseFitNotesCsv({ name: 'body-only.csv' }, createFitNotesCsvExport(data))
  assert.equal(parsed.workoutSets.length, 0)
  assert.equal(parsed.measurementRecords.length, 3)
})
