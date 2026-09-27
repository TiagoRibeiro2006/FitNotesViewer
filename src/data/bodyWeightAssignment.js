export function getBodyWeightDeletionIds(item) {
  const ids = []
  const itemId = String(item?.id ?? '')
  if (itemId) ids.push(itemId)

  const isBodyWeight = normalizeName(item?.name) === 'bodyweight'
    || (item?.sourceType === 'bodyWeight' && item?.sourceField === 'bodyWeightMetric')

  if (isBodyWeight && !ids.includes('body-weight')) ids.push('body-weight')
  return ids
}

function normalizeName(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}
