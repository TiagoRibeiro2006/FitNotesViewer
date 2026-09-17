import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import initSqlJs from 'sql.js'
import { synchronizeFitNotesData } from '../src/fitnotes/synchronizeFitNotesData.js'

const wasmPath = fileURLToPath(new URL('../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url))
const SQL = await initSqlJs({ locateFile: () => wasmPath })

function createDatabase() {
  const db = new SQL.Database()
  db.run(`
    CREATE TABLE training_log (_id INTEGER PRIMARY KEY AUTOINCREMENT, exercise_id INTEGER, date TEXT, metric_weight REAL, reps INTEGER, unit INTEGER, routine_section_exercise_set_id INTEGER, timer_auto_start INTEGER, is_personal_record INTEGER, is_personal_record_first INTEGER, is_complete INTEGER, is_pending_update INTEGER, distance REAL, duration_seconds INTEGER);
    CREATE TABLE exercise (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE BodyWeight (_id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, body_weight_metric REAL NOT NULL, body_fat REAL NOT NULL, comments TEXT);
    CREATE TABLE Measurement (_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, unit_id INTEGER NOT NULL DEFAULT 0, goal_type INTEGER NOT NULL DEFAULT 0, goal_value REAL NOT NULL DEFAULT 0, custom INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE MeasurementUnit (_id INTEGER PRIMARY KEY AUTOINCREMENT, type INTEGER NOT NULL DEFAULT 0, long_name TEXT NOT NULL, short_name TEXT NOT NULL);
    CREATE TABLE MeasurementRecord (_id INTEGER PRIMARY KEY AUTOINCREMENT, measurement_id INTEGER NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, value REAL NOT NULL, comment TEXT);
    INSERT INTO MeasurementUnit VALUES (1, 1, 'Old', 'old');
    INSERT INTO Measurement VALUES (1, 'Old Measurement', 1, 0, 0, 0, 1, 0);
    INSERT INTO MeasurementRecord VALUES (1, 1, '2026-08-01', '08:00:00', 99, NULL);
  `)
  return db
}

function rows(db, sql) {
  const result = db.exec(sql)[0]
  if (!result) return []
  return result.values.map((values) => Object.fromEntries(result.columns.map((column, index) => [column, values[index]])))
}

test('SQLite synchronization replaces stale Body data and maps local string IDs to valid integer IDs', () => {
  const db = createDatabase()
  try {
    synchronizeFitNotesData(db, {
      workoutSets: [],
      measurementUnits: [
        { id: 2, type: 1, longName: 'Kilograms', shortName: 'kg' },
        { id: 'local-cm', type: 2, longName: 'Centimetres', shortName: 'cm' },
      ],
      measurements: [
        { id: 1, name: 'Bodyweight', unitId: 2, enabled: 1, sortOrder: 0 },
        { id: 'local-waist', name: 'Waist', unitId: 'local-cm', custom: 1, enabled: 1, sortOrder: 1 },
      ],
      measurementRecords: [
        { id: 193, measurementId: 1, date: '2026-08-28', time: '12:18:00', value: 65.9 },
        { id: 'local-new-weight', measurementId: 1, date: '2026-09-16', time: '09:30:00', value: 66.2 },
        { id: 'local-waist-record', measurementId: 'local-waist', date: '2026-09-16', time: '09:31:00', value: 74.5 },
      ],
      bodyWeights: [
        { id: 'legacy', date: '2026-09-14', bodyWeightMetric: 66, bodyFat: null, comments: null },
      ],
    })

    const records = rows(db, 'SELECT mr._id, mr.date, mr.time, mr.value, m.name FROM MeasurementRecord mr JOIN Measurement m ON m._id = mr.measurement_id ORDER BY mr.date, mr.time')
    assert.equal(records.length, 3)
    assert.equal(records.at(-1).date, '2026-09-16')
    assert.equal(records.at(-1).name, 'Waist')
    assert.ok(records.every((record) => Number.isInteger(record._id)))
    assert.equal(rows(db, "SELECT COUNT(*) AS count FROM MeasurementRecord WHERE value = 99")[0].count, 0)

    const units = rows(db, 'SELECT _id, short_name FROM MeasurementUnit ORDER BY _id')
    assert.deepEqual(units.map((unit) => unit.short_name), ['kgs', 'cm'])

    const legacy = rows(db, 'SELECT body_weight_metric, body_fat FROM BodyWeight')[0]
    assert.equal(legacy.body_weight_metric, 66)
    assert.equal(legacy.body_fat, 0)
  } finally {
    db.close()
  }
})
