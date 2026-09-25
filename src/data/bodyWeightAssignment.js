export function resolveBodyWeightMeasurement(measurements, assignedId = '') {
  const items = Array.isArray(measurements) ? measurements : []
  const normalizedAssignedId = String(assignedId ?? '')

  if (normalizedAssignedId) {
    const assigned = items.find((item) => String(item?.id ?? '') === normalizedAssignedId)
    return isAssignableBodyWeightItem(assigned) ? assigned : null
  }

  let bestMatch = null
  let bestScore = 0

  for (const item of items) {
    if (!isAssignableBodyWeightItem(item) || !isAutomaticBodyWeightItem(item)) continue
    const score = bodyWeightNameScore(item?.name)
    if (score <= bestScore) continue
    bestMatch = item
    bestScore = score
  }

  return bestMatch
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
  if (!item || !isWeightUnit(item.unit)) return false

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

function bodyWeightNameScore(value) {
  const name = normalizeName(value)
  if (!name) return 0

  if (name === 'bodyweight') return 100
  if (name === 'weight') return 95
  if (name === 'bodymass') return 90
  if (name === 'pesocorporal') return 90
  if (name === 'peso') return 85

  const excluded = ['muscle', 'lean', 'fat', 'water', 'bone', 'visceral', 'musculo', 'gordura', 'agua', 'ossea']
  if (excluded.some((term) => name.includes(term))) return 0

  if (name.includes('bodyweight')) return 80
  if (name.includes('bodymass')) return 75
  if (name.includes('weight')) return 70
  if (name.includes('pesocorporal')) return 70
  return 0
}

function normalizeName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

import { isWeightUnit } from '../shared/units/weightUnits.js'
