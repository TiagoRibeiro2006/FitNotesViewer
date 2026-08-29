import { shiftDateKey, todayKey } from '../../../shared/utils/dates.js'

export const CHART_RANGE_OPTIONS = [
  { id: '30d', label: '30D', days: 30 },
  { id: '90d', label: '90D', days: 90 },
  { id: '6m', label: '6M', days: 183 },
  { id: '1y', label: '1Y', days: 365 },
  { id: 'all', label: 'All', days: null },
]

export function filterByDateRange(rows, rangeId, endDate = todayKey()) {
  const range = findRange(rangeId)
  if (range.days === null) return [...rows]

  const startDate = shiftDateKey(endDate, 1 - range.days)
  const filtered = []
  for (const row of rows) {
    if (row.date >= startDate && row.date <= endDate) filtered.push(row)
  }
  return filtered
}

export function rangeDayCount(rangeId, rows = []) {
  const range = findRange(rangeId)
  if (range.days !== null) return range.days
  if (!rows.length) return 0

  let firstDate = rows[0].date
  let lastDate = rows[0].date
  for (const row of rows) {
    if (row.date < firstDate) firstDate = row.date
    if (row.date > lastDate) lastDate = row.date
  }
  return differenceInDays(firstDate, lastDate) + 1
}

export function dateRangeBounds(rangeId, rows = [], endDate = todayKey()) {
  const range = findRange(rangeId)
  if (range.days !== null) {
    return { startDate: shiftDateKey(endDate, 1 - range.days), endDate }
  }
  if (!rows.length) return { startDate: endDate, endDate }

  let startDate = rows[0].date
  let lastDate = rows[0].date
  for (const row of rows) {
    if (row.date < startDate) startDate = row.date
    if (row.date > lastDate) lastDate = row.date
  }
  return { startDate, endDate: lastDate }
}

export function differenceInDays(firstDate, secondDate) {
  return Math.max(0, Math.round((dateKeyToTime(secondDate) - dateKeyToTime(firstDate)) / 86400000))
}

export function dateKeyToTime(dateKey) {
  const parts = String(dateKey).split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime()
}

function findRange(rangeId) {
  for (const range of CHART_RANGE_OPTIONS) {
    if (range.id === rangeId) return range
  }
  return CHART_RANGE_OPTIONS[1]
}
