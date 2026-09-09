const MILLISECONDS_PER_DAY = 86400000

export function calculateBodyWeightTrend(records) {
  const values = normalizeRecords(records)
  const first = values[0] ?? null
  const latest = values[values.length - 1] ?? null
  const periodDays = first && latest ? differenceInDays(first.date, latest.date) : 0
  const change = first && latest ? latest.value - first.value : 0
  const changePercent = first?.value ? (change / first.value) * 100 : 0
  const weeklyChangePercent = periodDays ? (changePercent / periodDays) * 7 : 0
  const uniqueDayCount = countUniqueDays(values)

  return {
    recordCount: values.length,
    uniqueDayCount,
    firstDate: first?.date ?? null,
    lastDate: latest?.date ?? null,
    firstValue: first?.value ?? null,
    lastValue: latest?.value ?? null,
    periodDays,
    change: round(change, 2),
    changePercent: round(changePercent, 2),
    weeklyChangePercent: round(weeklyChangePercent, 2),
    trend: findTrend(weeklyChangePercent),
    consistency: findConsistency(uniqueDayCount, periodDays),
    hasEnoughData: values.length >= 2 && periodDays >= 1,
  }
}

function normalizeRecords(records) {
  const values = []

  for (const record of records ?? []) {
    const date = normalizeDate(record?.date)
    const value = Number(record?.value)
    if (!date || !Number.isFinite(value) || value <= 0) continue

    values.push({
      date,
      time: String(record?.time ?? ''),
      value,
    })
  }

  values.sort(compareRecords)
  return values
}

function normalizeDate(value) {
  const date = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null

  const parts = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
  if (parsed.getUTCFullYear() !== parts[0]) return null
  if (parsed.getUTCMonth() !== parts[1] - 1) return null
  if (parsed.getUTCDate() !== parts[2]) return null
  return date
}

function differenceInDays(firstDate, lastDate) {
  return Math.round((dateToTimestamp(lastDate) - dateToTimestamp(firstDate)) / MILLISECONDS_PER_DAY)
}

function dateToTimestamp(date) {
  const parts = date.split('-').map(Number)
  return Date.UTC(parts[0], parts[1] - 1, parts[2])
}

function countUniqueDays(records) {
  const days = new Set()
  for (const record of records) days.add(record.date)
  return days.size
}

function findTrend(weeklyChangePercent) {
  if (weeklyChangePercent > 0.1) return 'gaining'
  if (weeklyChangePercent < -0.1) return 'losing'
  return 'stable'
}

function findConsistency(uniqueDayCount, periodDays) {
  if (periodDays < 7) return 'limited'

  const observedWeeks = periodDays / 7
  const measurementsPerWeek = uniqueDayCount / observedWeeks
  if (measurementsPerWeek >= 3) return 'high'
  if (measurementsPerWeek >= 1.5) return 'moderate'
  return 'low'
}

function compareRecords(first, second) {
  const dateComparison = first.date.localeCompare(second.date)
  if (dateComparison !== 0) return dateComparison
  return first.time.localeCompare(second.time)
}

function round(value, decimals) {
  return Number(value.toFixed(decimals))
}
