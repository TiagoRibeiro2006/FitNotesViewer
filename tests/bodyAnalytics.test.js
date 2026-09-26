import assert from 'node:assert/strict'
import test from 'node:test'
import { createBodyAnalytics } from '../src/features/charts/analytics/bodyAnalytics.js'

test('summarizes body records inside the selected interval', () => {
  const measurement = {
    records: [
      { date: '2026-09-01', value: 80 },
      { date: '2026-09-10', value: 78 },
      { date: '2026-09-20', value: 76 },
    ],
  }

  const analytics = createBodyAnalytics(measurement, '2026-09-01', '2026-09-10')

  assert.equal(analytics.current, 78)
  assert.equal(analytics.change, -2)
  assert.equal(analytics.changePercent, -2.5)
  assert.equal(analytics.minimum, 78)
  assert.equal(analytics.maximum, 80)
  assert.equal(analytics.average, 79)
})

test('returns an empty summary when the interval has no records', () => {
  const analytics = createBodyAnalytics({ records: [] }, '2026-09-01', '2026-09-10')

  assert.deepEqual(analytics, {
    records: [],
    current: null,
    change: null,
    changePercent: null,
    minimum: null,
    maximum: null,
    average: null,
  })
})

test('does not calculate a percentage from a zero starting value', () => {
  const analytics = createBodyAnalytics({ records: [
    { date: '2026-09-01', value: 0 },
    { date: '2026-09-02', value: 1 },
  ] })

  assert.equal(analytics.change, 1)
  assert.equal(analytics.changePercent, null)
})
