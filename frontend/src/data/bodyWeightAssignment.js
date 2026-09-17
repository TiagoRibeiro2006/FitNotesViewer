export function resolveBodyWeightMeasurement(measurements, assignedId = '') {
  const items = Array.isArray(measurements) ? measurements : []
  const normalizedAssignedId = String(assignedId ?? '')

  if (normalizedAssignedId) {
    const assigned = items.find((item) => String(item?.id ?? '') === normalizedAssignedId)
    return isAssignableBodyWeightItem(assigned) ? assigned : null
  }

  const namedBodyWeight = items.find((item) => {
    return isAssignableBodyWeightItem(item)
      && normalizeName(item?.name) === 'bodyweight'
      && isAutomaticBodyWeightItem(item)
  })
  return namedBodyWeight ?? null
}

export function getBodyWeightDeletionIds(item) {
  const ids = []
  const itemId = String(item?.id ?? '')
  if (itemId) ids.push(itemId)

  const isBodyWeight = normalizeName(item?.name) === 'bodyweight'
    || (item?.sourceType === 'bodyWeight' && item?.sourceField === 'bodyWeightMetric')

  if (isBodyWeight && !ids.includes('body-weight')) ids.push('body-weight')
  return ids
}

export function buildBodyWeightAssignmentOptions(favorites, measurements) {
  const options = []
  const seen = new Set()

  appendOptions(options, seen, favorites)
  appendOptions(options, seen, measurements)

  return options
}

export function isAssignableBodyWeightItem(item) {
  if (!item || normalizeUnit(item.unit) !== 'kg') return false

  if (item.sourceType === 'bodyWeight') {
    const hasStoredValue = item.value !== null
      && item.value !== undefined
      && Number.isFinite(Number(item.value))
    return item.sourceField === 'bodyWeightMetric'
      && (item.bodyDefinitionExists !== false || hasStoredValue)
  }

  return item.sourceType === 'measurement'
    && item.sourceId !== null
    && item.sourceId !== undefined
}

function appendOptions(options, seen, items) {
  for (const item of items ?? []) {
    const id = String(item?.id ?? '')
    if (!id || seen.has(id) || !isAssignableBodyWeightItem(item)) continue
    seen.add(id)
    options.push(item)
  }
}

function isAutomaticBodyWeightItem(item) {
  return item?.sourceType === 'measurement' || item?.bodyDefinitionExists === true
}

function normalizeName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizeUnit(value) {
  const unit = String(value ?? '').trim().toLowerCase()
  return unit === 'kgs' ? 'kg' : unit
}
