import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createRecentDateInterval,
  dateIntervalDayCount,
  filterByDateInterval,
  normalizeSelectableDateInterval,
} from '../src/features/charts/analytics/dateRanges.js'

test('creates inclusive recent intervals and counts their calendar days', () => {
  const interval = createRecentDateInterval(7, '2026-09-26')

  assert.deepEqual(interval, { startDate: '2026-09-20', endDate: '2026-09-26' })
  assert.equal(dateIntervalDayCount(interval.startDate, interval.endDate), 7)
})

test('rejects reversed, single-day and future selectable intervals', () => {
  assert.equal(normalizeSelectableDateInterval('2026-09-26', '2026-09-25', '2026-09-26'), null)
  assert.equal(normalizeSelectableDateInterval('2026-09-26', '2026-09-26', '2026-09-26'), null)
  assert.equal(normalizeSelectableDateInterval('2026-09-25', '2026-09-27', '2026-09-26'), null)
})

test('filters rows inclusively and leaves them unchanged for an invalid interval', () => {
  const rows = [
    { id: 1, date: '2026-09-19' },
    { id: 2, date: '2026-09-20' },
    { id: 3, date: '2026-09-26' },
    { id: 4, date: '2026-09-27' },
  ]

  assert.deepEqual(filterByDateInterval(rows, '2026-09-20', '2026-09-26').map((row) => row.id), [2, 3])
  assert.deepEqual(filterByDateInterval(rows, 'invalid', '2026-09-26'), rows)
})
