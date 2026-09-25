import { filterByDateInterval } from './dateRanges.js'

export function createBodyAnalytics(measurement, startDate, endDate) {
  const allRecords = measurement?.records ?? []
  const records = filterByDateInterval(allRecords, startDate, endDate)
  if (!records.length) return emptyBodyAnalytics(records)

  let minimum = records[0].value
  let maximum = records[0].value
  let total = 0
  for (const record of records) {
    minimum = Math.min(minimum, record.value)
    maximum = Math.max(maximum, record.value)
    total += record.value
  }

  const first = records[0]
  const latest = records.at(-1)
  const change = latest.value - first.value
  return {
    records,
    current: latest.value,
    change,
    changePercent: first.value === 0 ? null : (change / first.value) * 100,
    minimum,
    maximum,
    average: total / records.length,
  }
}

function emptyBodyAnalytics(records) {
  return {
    records,
    current: null,
    change: null,
    changePercent: null,
    minimum: null,
    maximum: null,
    average: null,
  }
}
