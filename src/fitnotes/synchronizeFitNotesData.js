import { hasTable, queryRows } from './sqliteHelpers.js'
import { readFitNotesDatabase } from './readFitNotesDatabase.js'
import { synchronizeFitNotesDatabase } from './synchronizeFitNotesDatabase.js'

export function synchronizeFitNotesData(db, data = {}) {
  // Older callers may supply only workouts or Body data. Preserve omitted stores.
  const snapshot = { ...readFitNotesDatabase({ name: '' }, db), ...data }
  db.run('BEGIN TRANSACTION;')
  try {
    db.run('PRAGMA defer_foreign_keys = ON;')
    synchronizeFitNotesDatabase(db, snapshot)
    synchronizeBodyData(db, snapshot)
    db.run('COMMIT;')
  } catch (error) {
    db.run('ROLLBACK;')
    throw error
  }
}

export function synchronizeBodyData(db, data = {}) {
  const requiredTables = ['BodyWeight', 'Measurement', 'MeasurementUnit', 'MeasurementRecord']
  if (!requiredTables.every((tableName) => hasTable(db, tableName))) return

  const bodyWeights = Array.isArray(data.bodyWeights) ? data.bodyWeights : []
  const measurements = Array.isArray(data.measurements) ? data.measurements : []
  const measurementUnits = Array.isArray(data.measurementUnits) ? data.measurementUnits : []
  const measurementRecords = Array.isArray(data.measurementRecords) ? data.measurementRecords : []

  const unitIds = createIntegerIdMap(measurementUnits, readMaxId(db, 'MeasurementUnit'))
  const measurementIds = createIntegerIdMap(measurements, readMaxId(db, 'Measurement'))
  const recordIds = createIntegerIdMap(measurementRecords, readMaxId(db, 'MeasurementRecord'))
  const bodyWeightIds = createIntegerIdMap(bodyWeights, readMaxId(db, 'BodyWeight'))

  db.run('DELETE FROM MeasurementRecord;')
  db.run('DELETE FROM Measurement;')
  db.run('DELETE FROM MeasurementUnit;')
  db.run('DELETE FROM BodyWeight;')

  insertMeasurementUnits(db, measurementUnits, unitIds)
  insertMeasurements(db, measurements, measurementIds, unitIds)
  insertMeasurementRecords(db, measurementRecords, recordIds, measurementIds)
  insertBodyWeights(db, bodyWeights, bodyWeightIds)
}

function insertMeasurementUnits(db, units, idMap) {
  const statement = db.prepare(`
    INSERT INTO MeasurementUnit (_id, type, long_name, short_name)
    VALUES (?, ?, ?, ?);
  `)
  try {
    for (const unit of units) {
      statement.run([
        idMap.get(keyForId(unit.id)),
        toInteger(unit.type, 0),
        String(unit.longName ?? ''),
        normalizeUnitName(unit.shortName),
      ])
    }
  } finally {
    statement.free()
  }
}

function insertMeasurements(db, measurements, measurementIds, unitIds) {
  const statement = db.prepare(`
    INSERT INTO Measurement (
      _id, name, unit_id, goal_type, goal_value, custom, enabled, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `)
  try {
    for (const measurement of measurements) {
      const unitId = unitIds.get(keyForId(measurement.unitId)) ?? 0
      statement.run([
        measurementIds.get(keyForId(measurement.id)),
        String(measurement.name ?? 'Measurement'),
        unitId,
        toInteger(measurement.goalType, 0),
        toNumber(measurement.goalValue, 0),
        toInteger(measurement.custom, 0),
        toInteger(measurement.enabled, 1),
        toInteger(measurement.sortOrder, 0),
      ])
    }
  } finally {
    statement.free()
  }
}

function insertMeasurementRecords(db, records, recordIds, measurementIds) {
  const statement = db.prepare(`
    INSERT INTO MeasurementRecord (_id, measurement_id, date, time, value, comment)
    VALUES (?, ?, ?, ?, ?, ?);
  `)
  try {
    for (const record of records) {
      const measurementId = measurementIds.get(keyForId(record.measurementId))
      if (!measurementId) continue
      const value = Number(record.value)
      if (!Number.isFinite(value)) continue
      const date = String(record.date ?? '').trim()
      if (!date) continue

      statement.run([
        recordIds.get(keyForId(record.id)),
        measurementId,
        date,
        normalizeTime(record.time),
        value,
        nullableText(record.comment),
      ])
    }
  } finally {
    statement.free()
  }
}

function insertBodyWeights(db, rows, idMap) {
  const statement = db.prepare(`
    INSERT INTO BodyWeight (_id, date, body_weight_metric, body_fat, comments)
    VALUES (?, ?, ?, ?, ?);
  `)
  try {
    for (const row of rows) {
      const date = String(row.date ?? '').trim()
      if (!date) continue
      const bodyWeight = positiveOrZero(row.bodyWeightMetric)
      const bodyFat = positiveOrZero(row.bodyFat)
      if (bodyWeight === 0 && bodyFat === 0 && !String(row.comments ?? '').trim()) continue

      statement.run([
        idMap.get(keyForId(row.id)),
        date,
        bodyWeight,
        bodyFat,
        nullableText(row.comments),
      ])
    }
  } finally {
    statement.free()
  }
}

function createIntegerIdMap(items, storedMaxId = 0) {
  const map = new Map()
  const used = new Set()
  let nextId = Math.max(0, toInteger(storedMaxId, 0))

  for (const item of items) {
    const id = sqliteIntegerId(item?.id)
    if (id === null || used.has(id)) continue
    map.set(keyForId(item.id), id)
    used.add(id)
    if (id > nextId) nextId = id
  }

  for (const item of items) {
    const key = keyForId(item?.id)
    if (map.has(key)) continue
    do nextId += 1
    while (used.has(nextId))
    map.set(key, nextId)
    used.add(nextId)
  }

  return map
}

function sqliteIntegerId(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed
  }
  return null
}

function readMaxId(db, tableName) {
  const rows = queryRows(db, `SELECT MAX(_id) AS maxId FROM "${tableName}";`)
  return Number(rows[0]?.maxId ?? 0)
}

function keyForId(value) {
  return typeof value + ':' + String(value ?? '')
}

function normalizeUnitName(value) {
  const unit = String(value ?? '')
  return unit === 'kg' ? 'kgs' : unit
}

function normalizeTime(value) {
  const time = String(value ?? '').trim()
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time
  if (/^\d{2}:\d{2}$/.test(time)) return time + ':00'
  return '00:00:00'
}

function nullableText(value) {
  if (value === null || value === undefined) return null
  const text = String(value)
  return text === '' ? null : text
}

function toNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function toInteger(value, fallback) {
  const number = Number(value)
  return Number.isInteger(number) ? number : fallback
}

function positiveOrZero(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}
