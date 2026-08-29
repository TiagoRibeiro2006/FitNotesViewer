import { dateToKey, normalizeDateKey, normalizeTimeKey, timeToKey } from '../../shared/utils/dates'
import { createLocalId } from '../../shared/utils/ids'
import { normalizeNonNegativeNumber } from '../../shared/utils/validation'
import { DEFAULT_BODY_MEASUREMENTS, DEFAULT_BODY_UNITS } from '../defaults/bodyMeasurements'
import { openAppDatabase } from '../indexedDb/database'
import { markLocalChanges, requestResult, transactionComplete } from '../indexedDb/transactions'

const FAVORITE_DEFINITIONS = [
  { id: 'body-fat', name: 'Body Fat', aliases: ['Body Fat'], unit: '%', field: 'bodyFat' },
  { id: 'body-weight', name: 'Body Weight', aliases: ['Bodyweight', 'Body Weight'], unit: 'kg', field: 'bodyWeightMetric' },
  { id: 'muscle-mass', name: 'Muscle Mass', aliases: ['Muscle Mass'], unit: 'kg' },
  { id: 'visceral-fat', name: 'Visceral Fat', aliases: ['Visceral Fat'], unit: '%' },
]

export async function getBodyTrackerData() {
  const database = await openAppDatabase()
  await ensureDefaultBodyMeasurements(database)
  const transaction = database.transaction(['metadata', 'bodyWeights', 'measurements', 'measurementUnits', 'measurementRecords'], 'readonly')
  const done = transactionComplete(transaction)
  const [favoritesRecord, deletedRecord, bodyWeights, measurements, units, records] = await Promise.all([
    requestResult(transaction.objectStore('metadata').get('bodyFavoriteIds')),
    requestResult(transaction.objectStore('metadata').get('bodyDeletedIds')),
    requestResult(transaction.objectStore('bodyWeights').getAll()),
    requestResult(transaction.objectStore('measurements').getAll()),
    requestResult(transaction.objectStore('measurementUnits').getAll()),
    requestResult(transaction.objectStore('measurementRecords').getAll()),
  ])
  await done
  return buildBodyTrackerData(bodyWeights, measurements, units, records, favoritesRecord?.value, deletedRecord?.value)
}

async function ensureDefaultBodyMeasurements(database) {
  const lookupTransaction = database.transaction(['measurements', 'metadata'], 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const results = await Promise.all([
    requestResult(lookupTransaction.objectStore('measurements').count()),
    requestResult(lookupTransaction.objectStore('metadata').get('bodyDefaultsInitialized')),
  ])
  await lookupDone
  if (results[1]?.value === true) return

  const transaction = database.transaction(['measurements', 'measurementUnits', 'metadata'], 'readwrite')
  transaction.objectStore('metadata').put({ key: 'bodyDefaultsInitialized', value: true })
  if (results[0] > 0) {
    await transactionComplete(transaction)
    return
  }

  const measurementStore = transaction.objectStore('measurements')
  const unitStore = transaction.objectStore('measurementUnits')
  for (const unit of DEFAULT_BODY_UNITS) unitStore.put(unit)
  for (const measurement of DEFAULT_BODY_MEASUREMENTS) measurementStore.put(measurement)
  await transactionComplete(transaction)
}

export async function saveBodyFavoriteIds(ids) {
  const database = await openAppDatabase()
  const transaction = database.transaction('metadata', 'readwrite')
  transaction.objectStore('metadata').put({ key: 'bodyFavoriteIds', value: [...new Set(ids.map(String))] })
  await transactionComplete(transaction)
}

export async function getBodyMeasurementHistory(item) {
  const database = await openAppDatabase()
  const transaction = database.transaction(['bodyWeights', 'measurements', 'measurementRecords'], 'readonly')
  const done = transactionComplete(transaction)
  const [bodyWeights, measurements, records] = await Promise.all([
    requestResult(transaction.objectStore('bodyWeights').getAll()),
    requestResult(transaction.objectStore('measurements').getAll()),
    requestResult(transaction.objectStore('measurementRecords').getAll()),
  ])
  await done

  if (item?.sourceType === 'bodyWeight') return buildBodyWeightHistory(item, bodyWeights)

  const measurementId = findMeasurementId(item, measurements)
  if (measurementId === null) return []
  return buildMeasurementHistory(measurementId, records)
}

export async function saveBodyMeasurementValue(item, rawValue, selectedDate, selectedTime) {
  const value = normalizeNonNegativeNumber(rawValue)
  if (value === null) throw new Error('Enter a valid value.')

  const database = await openAppDatabase()
  const now = new Date()
  const date = selectedDate === undefined ? dateToKey(now) : normalizeDateKey(selectedDate)
  const time = selectedTime === undefined ? timeToKey(now) : normalizeTimeKey(selectedTime)
  if (!date || !time) throw new Error('Choose a valid date and time.')

  const record = {
    id: createLocalId('local-body-record'),
    date,
    time,
    value,
    createdLocally: true,
    localUpdatedAt: now.toISOString(),
  }

  if (item?.sourceId !== null && item?.sourceId !== undefined) {
    await saveMeasurementRecord(database, { ...record, measurementId: item.sourceId, comment: null })
  } else if (item?.sourceType === 'bodyWeight' && ['bodyWeightMetric', 'bodyFat'].includes(item.sourceField)) {
    await saveBodyWeightRecord(database, item.sourceField, record)
  } else {
    await saveNewMeasurement(database, item, record)
  }

  return getBodyTrackerData()
}

export async function updateBodyMeasurementRecord(record, rawValue) {
  const value = normalizeNonNegativeNumber(rawValue)
  if (value === null) throw new Error('Enter a valid value.')

  const database = await openAppDatabase()
  const storedRecord = await getStoredBodyRecord(database, record)
  if (!storedRecord) throw new Error('This value no longer exists.')

  const updatedAt = new Date().toISOString()
  const updatedRecord = record.sourceType === 'bodyWeight'
    ? { ...storedRecord, [record.sourceField]: value, localUpdatedAt: updatedAt }
    : { ...storedRecord, value, localUpdatedAt: updatedAt }
  await saveStoredBodyRecord(database, record, updatedRecord, updatedAt)
  return getBodyTrackerData()
}

export async function deleteBodyMeasurementRecord(record) {
  const database = await openAppDatabase()
  const storedRecord = await getStoredBodyRecord(database, record)
  if (!storedRecord) return getBodyTrackerData()

  const updatedAt = new Date().toISOString()
  const transaction = database.transaction([bodyRecordStoreName(record), 'metadata'], 'readwrite')
  const store = transaction.objectStore(bodyRecordStoreName(record))

  if (record.sourceType === 'bodyWeight') {
    const updatedRecord = { ...storedRecord, [record.sourceField]: null, localUpdatedAt: updatedAt }
    if (hasBodyWeightContent(updatedRecord)) store.put(updatedRecord)
    else store.delete(record.id)
  } else {
    store.delete(record.id)
  }

  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)
  return getBodyTrackerData()
}

export async function deleteBodyMeasurement(item) {
  const currentData = await getBodyTrackerData()
  const database = await openAppDatabase()
  const lookupTransaction = database.transaction(
    ['metadata', 'bodyWeights', 'measurements', 'measurementRecords'],
    'readonly',
  )
  const lookupDone = transactionComplete(lookupTransaction)
  const results = await Promise.all([
    requestResult(lookupTransaction.objectStore('metadata').get('bodyFavoriteIds')),
    requestResult(lookupTransaction.objectStore('metadata').get('bodyDeletedIds')),
    requestResult(lookupTransaction.objectStore('bodyWeights').getAll()),
    requestResult(lookupTransaction.objectStore('measurements').getAll()),
    requestResult(lookupTransaction.objectStore('measurementRecords').getAll()),
  ])
  await lookupDone

  const measurementId = findMeasurementId(item, results[3] ?? [])
  const updatedAt = new Date().toISOString()
  const transaction = database.transaction(
    ['metadata', 'bodyWeights', 'measurements', 'measurementRecords'],
    'readwrite',
  )

  if (measurementId !== null) {
    transaction.objectStore('measurements').delete(measurementId)
    const recordStore = transaction.objectStore('measurementRecords')
    for (const record of results[4] ?? []) {
      if (record.measurementId === measurementId) recordStore.delete(record.id)
    }
  }

  if (item?.sourceType === 'bodyWeight' && item.sourceField) {
    const bodyWeightStore = transaction.objectStore('bodyWeights')
    for (const row of results[2] ?? []) {
      const updatedRow = { ...row, [item.sourceField]: null, localUpdatedAt: updatedAt }
      if (hasBodyWeightContent(updatedRow)) bodyWeightStore.put(updatedRow)
      else bodyWeightStore.delete(row.id)
    }
  }

  const itemId = String(item?.id ?? '')
  const favoriteIds = currentData.favorites
    .map((favorite) => String(favorite.id))
    .filter((id) => id !== itemId)
  const deletedIds = Array.isArray(results[1]?.value) ? results[1].value.map(String) : []
  if (itemId && !deletedIds.includes(itemId)) deletedIds.push(itemId)

  const metadataStore = transaction.objectStore('metadata')
  metadataStore.put({ key: 'bodyFavoriteIds', value: favoriteIds })
  metadataStore.put({ key: 'bodyDeletedIds', value: deletedIds })
  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)
  return getBodyTrackerData()
}

export async function updateBodyMeasurementName(item, rawName) {
  const name = normalizeMeasurementName(rawName)
  const database = await openAppDatabase()
  const lookupTransaction = database.transaction('measurements', 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const measurements = await requestResult(lookupTransaction.objectStore('measurements').getAll())
  await lookupDone

  const measurementId = findMeasurementId(item, measurements ?? [])
  if (measurementId === null) throw new Error('Measurement could not be found.')

  let measurement = null
  for (const candidate of measurements ?? []) {
    if (candidate.id === measurementId) measurement = candidate
  }
  if (!measurement) throw new Error('Measurement could not be found.')

  const updatedAt = new Date().toISOString()
  const transaction = database.transaction(['measurements', 'metadata'], 'readwrite')
  transaction.objectStore('measurements').put({
    ...measurement,
    name,
    bodyNameEdited: true,
    localUpdatedAt: updatedAt,
  })
  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)
  return getBodyTrackerData()
}

async function getStoredBodyRecord(database, record) {
  const storeName = bodyRecordStoreName(record)
  const transaction = database.transaction(storeName, 'readonly')
  const done = transactionComplete(transaction)
  const storedRecord = await requestResult(transaction.objectStore(storeName).get(record.id))
  await done
  return storedRecord
}

async function saveStoredBodyRecord(database, record, updatedRecord, updatedAt) {
  const storeName = bodyRecordStoreName(record)
  const transaction = database.transaction([storeName, 'metadata'], 'readwrite')
  transaction.objectStore(storeName).put(updatedRecord)
  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)
}

function bodyRecordStoreName(record) {
  return record?.sourceType === 'bodyWeight' ? 'bodyWeights' : 'measurementRecords'
}

function hasBodyWeightContent(record) {
  return hasMeasurementValue(record.bodyWeightMetric)
    || hasMeasurementValue(record.bodyFat)
    || String(record.comments ?? '').trim() !== ''
}

async function saveMeasurementRecord(database, record) {
  const transaction = database.transaction(['measurementRecords', 'metadata'], 'readwrite')
  transaction.objectStore('measurementRecords').put(record)
  markLocalChanges(transaction, record.localUpdatedAt)
  await transactionComplete(transaction)
}

async function saveBodyWeightRecord(database, field, record) {
  const { value, ...recordData } = record
  const transaction = database.transaction(['bodyWeights', 'metadata'], 'readwrite')
  transaction.objectStore('bodyWeights').put({
    ...recordData,
    bodyWeightMetric: null,
    bodyFat: null,
    comments: null,
    [field]: value,
  })
  markLocalChanges(transaction, record.localUpdatedAt)
  await transactionComplete(transaction)
}

async function saveNewMeasurement(database, item, record) {
  const measurementId = `local-measurement-${normalizeBodyName(item?.name) || createLocalId('value')}`
  const unitId = `local-unit-${normalizeBodyName(item?.unit) || 'value'}`
  const transaction = database.transaction(['measurements', 'measurementUnits', 'measurementRecords', 'metadata'], 'readwrite')

  transaction.objectStore('measurementUnits').put({
    id: unitId,
    type: 0,
    longName: String(item?.unit ?? ''),
    shortName: String(item?.unit ?? ''),
    createdLocally: true,
  })
  transaction.objectStore('measurements').put({
    id: measurementId,
    localBodyId: String(item?.id ?? measurementId),
    name: String(item?.name ?? 'Measurement'),
    unitId,
    goalType: 0,
    goalValue: 0,
    custom: 1,
    enabled: 1,
    sortOrder: 9999,
    createdLocally: true,
  })
  transaction.objectStore('measurementRecords').put({
    ...record,
    measurementId,
    comment: null,
  })
  markLocalChanges(transaction, record.localUpdatedAt)
  await transactionComplete(transaction)
}

function buildBodyTrackerData(bodyWeights = [], measurements = [], units = [], records = [], savedFavoriteIds, savedDeletedIds) {
  const deletedIdSet = new Set(Array.isArray(savedDeletedIds) ? savedDeletedIds.map(String) : [])
  const unitsById = new Map(units.map((unit) => [unit.id, normalizeMeasurementUnit(unit.shortName)]))
  const measurementItems = measurements
    .map((measurement) => buildMeasurementItem(
      measurement,
      unitsById.get(measurement.unitId) || measurementUnitFallback(measurement.unitId),
      records,
    ))
    .filter((item) => !deletedIdSet.has(String(item.id)))
  const itemsByName = new Map(measurementItems.map((item) => [normalizeBodyName(item.name), item]))
  const defaultFavorites = FAVORITE_DEFINITIONS
    .map((definition) => buildDefaultFavorite(definition, itemsByName, bodyWeights))
    .filter((item) => !deletedIdSet.has(String(item.id)))
  const defaultFavoritesById = new Map(defaultFavorites.map((item) => [item.id, item]))
  let measurementsWithFavorites = measurementItems
    .filter((item) => item.enabled)
    .map((item) => defaultFavoritesById.get(item.id) ?? { ...item, favorite: false })

  const measurementIds = new Set(measurementsWithFavorites.map((item) => item.id))
  measurementsWithFavorites.push(...defaultFavorites.filter((item) => !measurementIds.has(item.id)))
  measurementsWithFavorites.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))

  const itemsById = new Map(measurementsWithFavorites.map((item) => [item.id, item]))
  const favoriteIds = Array.isArray(savedFavoriteIds)
    ? [...new Set(savedFavoriteIds.map(String))].filter((id) => itemsById.has(id))
    : defaultFavorites.map((item) => item.id)
  const favoriteIdSet = new Set(favoriteIds)

  return {
    favorites: favoriteIds.map((id) => ({ ...itemsById.get(id), favorite: true })),
    measurements: measurementsWithFavorites.map((item) => ({ ...item, favorite: favoriteIdSet.has(item.id) })),
  }
}

function buildDefaultFavorite(definition, itemsByName, bodyWeights) {
  const measurementItem = definition.aliases
    .map((name) => itemsByName.get(normalizeBodyName(name)))
    .find(Boolean)
  const bodyWeightItem = definition.field
    ? buildBodyWeightItem(definition.id, definition.name, definition.unit, bodyWeights, definition.field)
    : null
  const source = measurementItem?.value === null && bodyWeightItem?.value !== null
    ? bodyWeightItem
    : measurementItem ?? bodyWeightItem

  return {
    ...(source ?? buildBodyItem(definition.id, definition.name, definition.unit, [], () => null)),
    id: measurementItem?.id ?? definition.id,
    name: measurementItem?.bodyNameEdited ? measurementItem.name : definition.name,
    favorite: true,
  }
}

function buildBodyWeightItem(id, name, unit, rows, field) {
  const entries = rows
    .filter((row) => row[field] !== null && row[field] !== undefined && Number.isFinite(Number(row[field])))
    .sort(compareBodyEntries)
  return {
    ...buildBodyItem(id, name, unit, entries, (entry) => entry[field]),
    sourceType: 'bodyWeight',
    sourceField: field,
  }
}

function buildBodyWeightHistory(item, rows) {
  return rows
    .filter((row) => hasMeasurementValue(row[item.sourceField]))
    .sort(compareBodyEntries)
    .reverse()
    .map((row) => ({
      id: row.id,
      date: row.date ?? null,
      time: row.time ?? null,
      value: Number(row[item.sourceField]),
      sourceType: 'bodyWeight',
      sourceField: item.sourceField,
    }))
}

function buildMeasurementHistory(measurementId, records) {
  return records
    .filter((record) => record.measurementId === measurementId && hasMeasurementValue(record.value))
    .sort(compareBodyEntries)
    .reverse()
    .map((record) => ({
      id: record.id,
      date: record.date ?? null,
      time: record.time ?? null,
      value: Number(record.value),
      sourceType: 'measurement',
      sourceId: measurementId,
    }))
}

function findMeasurementId(item, measurements) {
  if (item?.sourceId !== null && item?.sourceId !== undefined) return item.sourceId
  const measurement = measurements.find((candidate) => String(candidate.localBodyId ?? '') === String(item?.id ?? ''))
  return measurement?.id ?? null
}

function hasMeasurementValue(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

function buildMeasurementItem(measurement, unit, records) {
  const entries = records
    .filter((record) => record.measurementId === measurement.id && Number.isFinite(Number(record.value)))
    .sort(compareBodyEntries)
  return {
    ...buildBodyItem(measurement.localBodyId ?? `measurement-${measurement.id}`, String(measurement.name ?? ''), unit, entries, (entry) => entry.value),
    sourceType: 'measurement',
    sourceId: measurement.id,
    enabled: Number(measurement.enabled ?? 1) !== 0,
  }
}

function buildBodyItem(id, name, unit, entries, getValue) {
  const latest = entries.at(-1)
  const previous = entries.at(-2)
  const value = latest ? Number(getValue(latest)) : null
  const previousValue = previous ? Number(getValue(previous)) : null
  return {
    id,
    name,
    unit,
    value,
    change: value !== null && previousValue !== null ? value - previousValue : null,
    date: latest?.date ?? null,
    time: latest?.time ?? null,
  }
}

function normalizeBodyName(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizeMeasurementUnit(value) {
  const unit = String(value ?? '').trim()
  return unit.toLowerCase() === 'kgs' ? 'kg' : unit
}

function normalizeMeasurementName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!name) throw new Error('Enter a measurement name.')
  if (name.length > 100) throw new Error('Measurement name must have 100 characters or fewer.')
  if (/[<>]/.test(name)) throw new Error('Measurement name cannot include < or >.')
  return name
}

function measurementUnitFallback(unitId) {
  return ({ 2: 'kg', 3: 'lbs', 4: 'cm', 5: 'in', 6: '%' })[Number(unitId)] ?? ''
}

function compareBodyEntries(a, b) {
  const dateComparison = String(a.date ?? '').localeCompare(String(b.date ?? ''))
  if (dateComparison !== 0) return dateComparison

  const timeComparison = String(a.time ?? '').localeCompare(String(b.time ?? ''))
  if (timeComparison !== 0) return timeComparison

  const idA = Number(a.id)
  const idB = Number(b.id)
  if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB
  return String(a.id).localeCompare(String(b.id))
}
