import { normalizeDateKey, shiftDateKey, todayKey } from '../../../shared/utils/dates.js'

export function createRecentDateInterval(days = 90, endDate = todayKey()) {
  const normalizedEnd = normalizeDateKey(endDate) ?? todayKey()
  const length = Math.max(1, Math.floor(Number(days) || 1))
  return {
    startDate: shiftDateKey(normalizedEnd, 1 - length),
    endDate: normalizedEnd,
  }
}

export function normalizeDateInterval(startDate, endDate) {
  const normalizedStart = normalizeDateKey(startDate)
  const normalizedEnd = normalizeDateKey(endDate)
  if (!normalizedStart || !normalizedEnd || normalizedStart > normalizedEnd) return null
  return { startDate: normalizedStart, endDate: normalizedEnd }
}

export function filterByDateInterval(rows, startDate, endDate) {
  const interval = normalizeDateInterval(startDate, endDate)
  if (!interval) return [...rows]

  const filtered = []
  for (const row of rows) {
    if (row.date >= interval.startDate && row.date <= interval.endDate) filtered.push(row)
  }
  return filtered
}

export function dateIntervalDayCount(startDate, endDate, rows = []) {
  const interval = normalizeDateInterval(startDate, endDate) ?? readRowDateInterval(rows)
  if (!interval) return 0
  return differenceInDays(interval.startDate, interval.endDate) + 1
}

export function differenceInDays(firstDate, secondDate) {
  return Math.max(0, Math.round((dateKeyToTime(secondDate) - dateKeyToTime(firstDate)) / 86400000))
}

export function dateKeyToTime(dateKey) {
  const parts = String(dateKey).split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime()
}

function readRowDateInterval(rows) {
  if (!rows.length) return null

  let startDate = rows[0].date
  let endDate = rows[0].date
  for (const row of rows) {
    if (row.date < startDate) startDate = row.date
    if (row.date > endDate) endDate = row.date
  }
  return normalizeDateInterval(startDate, endDate)
}
