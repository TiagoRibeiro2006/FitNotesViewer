const FAVORITE_DEFINITIONS = [
  { id: 'body-fat', name: 'Body Fat', aliases: ['Body Fat'], unit: '%', field: 'bodyFat' },
  { id: 'body-weight', name: 'Body Weight', aliases: ['Bodyweight', 'Body Weight'], unit: 'kg', field: 'bodyWeightMetric' },
  { id: 'muscle-mass', name: 'Muscle Mass', aliases: ['Muscle Mass'], unit: 'kg' },
  { id: 'visceral-fat', name: 'Visceral Fat', aliases: ['Visceral Fat'], unit: '%' },
]

export function buildBodyTrackerData(bodyWeights = [], measurements = [], units = [], records = [], savedFavoriteIds, savedDeletedIds) {
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
  const measurementsWithFavorites = measurementItems
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

export function buildBodyWeightHistory(item, rows) {
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

export function buildMeasurementHistory(measurementId, records) {
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

export function findMeasurementId(item, measurements) {
  if (item?.sourceId !== null && item?.sourceId !== undefined) return item.sourceId
  const measurement = measurements.find((candidate) => String(candidate.localBodyId ?? '') === String(item?.id ?? ''))
  return measurement?.id ?? null
}

export function hasMeasurementValue(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

export function normalizeBodyName(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function normalizeMeasurementUnit(value) {
  const unit = String(value ?? '').trim()
  return unit.toLowerCase() === 'kgs' ? 'kg' : unit
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
    bodyDefinitionExists: Boolean(measurementItem),
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
