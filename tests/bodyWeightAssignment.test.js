import assert from 'node:assert/strict'
import test from 'node:test'
import { getBodyWeightDeletionIds } from '../src/data/bodyWeightAssignment.js'

function measurement(id, name, unit, extra = {}) {
  return {
    id,
    name,
    unit,
    sourceType: 'measurement',
    sourceId: id,
    favorite: false,
    ...extra,
  }
}

test('deleting Body Weight also hides the synthetic body weight fallback', () => {
  const storedMeasurement = measurement('measurement-42', 'Body Weight', 'kg')
  assert.deepEqual(getBodyWeightDeletionIds(storedMeasurement), ['measurement-42', 'body-weight'])

  const native = {
    id: 'body-weight',
    name: 'Body Weight',
    unit: 'kg',
    sourceType: 'bodyWeight',
    sourceField: 'bodyWeightMetric',
  }
  assert.deepEqual(getBodyWeightDeletionIds(native), ['body-weight'])
})
