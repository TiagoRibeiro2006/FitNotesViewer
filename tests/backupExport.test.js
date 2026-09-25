import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import initSqlJs from 'sql.js'
import { readFitNotesDatabase } from '../src/fitnotes/readFitNotesDatabase.js'
import { synchronizeFitNotesData } from '../src/fitnotes/synchronizeFitNotesData.js'

const SQL = await initSqlJs()
const schema = readFileSync(new URL('./fixtures/fitnotes-schema.sql', import.meta.url), 'utf8')

function database(t) {
  const db = new SQL.Database()
  t.after(() => db.close())
  db.run(schema)
  db.run(`INSERT INTO Category (_id, name) VALUES (1, 'Chest');
    INSERT INTO exercise (_id, name, category_id, is_favourite) VALUES (1, 'Press', 1, 1);
    INSERT INTO training_log (_id, exercise_id, date, metric_weight, reps) VALUES (1, 1, '2026-09-01', 40, 8);
    INSERT INTO MeasurementUnit VALUES (1, 1, 'Kilograms', 'kgs');
    INSERT INTO Measurement (_id, name, unit_id, enabled) VALUES (1, 'Bodyweight', 1, 1);
    INSERT INTO MeasurementRecord VALUES (1, 1, '2026-09-01', '08:00:00', 70, NULL);
    CREATE TABLE untouched (value TEXT);
    INSERT INTO untouched VALUES ('preserved');`)
  return db
}

function read(db) {
  return readFitNotesDatabase({ name: 'test.fitnotes' }, db)
}

function roundTrip(db, data) {
  synchronizeFitNotesData(db, data)
  const restored = new SQL.Database(db.export())
  try { return read(restored) } finally { restored.close() }
}

test('exports edited names, categories, existing sets and body values without dropping unknown columns', (t) => {
  const db = database(t)
  const data = read(db)
  data.categories[0].name = 'Upper body'
  data.exercises[0].name = 'Bench Press'
  data.workoutSets[0].weight = 50
  data.measurements[0].name = 'Weight'
  data.measurementRecords[0].value = 71
  const result = roundTrip(db, data)
  assert.equal(result.categories[0].name, 'Upper body')
  assert.equal(result.exercises[0].name, 'Bench Press')
  assert.equal(result.workoutSets[0].weight, 50)
  assert.equal(result.measurements[0].name, 'Weight')
  assert.equal(result.measurementRecords[0].value, 71)
  assert.equal(db.exec('SELECT is_favourite FROM exercise')[0].values[0][0], 1)
  assert.equal(db.exec('SELECT value FROM untouched')[0].values[0][0], 'preserved')
})

test('maps local IDs across new categories, exercises, sets, units, measurements and records', (t) => {
  const db = database(t)
  const data = read(db)
  data.categories.push({ id: 'muscle-new', name: 'Back', colour: 123, sortOrder: 1 })
  data.exercises.push({ id: 'exercise-new', name: 'Row', categoryId: 'muscle-new', exerciseTypeId: null })
  data.workoutSets.push({ id: 'set-new', exerciseId: 'exercise-new', date: '2026-09-02', weight: 30, reps: 10 })
  data.measurementUnits.push({ id: 'unit-new', type: 2, longName: 'Centimetres', shortName: 'cm' })
  data.measurements.push({ id: 'measurement-new', name: 'Arm', unitId: 'unit-new', custom: 1, enabled: 1 })
  data.measurementRecords.push({ id: 'record-new', measurementId: 'measurement-new', date: '2026-09-02', time: '09:00', value: 32 })
  data.bodyWeights.push({ id: 'weight-new', date: '2026-09-02', bodyWeightMetric: 72, bodyFat: 15, comments: 'Example' })
  const originalBytes = db.export()
  const result = roundTrip(db, data)
  const exercise = result.exercises.find((row) => row.name === 'Row')
  assert.ok(Number.isSafeInteger(exercise.id))
  assert.equal(result.categories.find((row) => row.id === exercise.categoryId).name, 'Back')
  assert.equal(result.workoutSets.find((row) => row.exerciseId === exercise.id).weight, 30)
  const measurement = result.measurements.find((row) => row.name === 'Arm')
  assert.equal(result.measurementUnits.find((row) => row.id === measurement.unitId).shortName, 'cm')
  assert.equal(result.measurementRecords.find((row) => row.measurementId === measurement.id).value, 32)
  assert.equal(result.bodyWeights[0].bodyWeightMetric, 72)
  assert.equal(result.bodyWeights[0].bodyFat, 15)
  const freshSource = new SQL.Database(originalBytes)
  try {
    assert.deepEqual(roundTrip(freshSource, data), result, 'exports from the same original backup must remain stable')
  } finally { freshSource.close() }
})

test('removes deleted exercises, their sets and body records from the exported backup', (t) => {
  const db = database(t)
  const data = read(db)
  data.workoutSets = []
  data.exercises = []
  data.categories = []
  data.measurementRecords = []
  data.measurements = []
  const result = roundTrip(db, data)
  assert.equal(result.workoutSets.length, 0)
  assert.equal(result.exercises.length, 0)
  assert.equal(result.categories.length, 0)
  assert.equal(result.measurementRecords.length, 0)
  assert.equal(result.measurements.length, 0)
})

test('rolls back all changes if a local relationship is invalid', (t) => {
  const db = database(t)
  const original = read(db)
  const data = structuredClone(original)
  data.categories[0].name = 'Must roll back'
  data.exercises[0].categoryId = 'missing'
  assert.throws(() => synchronizeFitNotesData(db, data), /Missing categories reference/)
  assert.deepEqual(read(db), original)
})

test('preserves omitted stores for legacy export callers', (t) => {
  const db = database(t)
  const original = read(db)
  const data = structuredClone(original)
  delete data.measurementRecords
  synchronizeFitNotesData(db, data)
  assert.deepEqual(read(db), original)
})
