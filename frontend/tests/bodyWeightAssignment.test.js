import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildBodyWeightAssignmentOptions,
  getBodyWeightDeletionIds,
  resolveBodyWeightMeasurement,
} from '../src/data/bodyWeightAssignment.js'

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

test('body weight assignment options keep favorites first and body page order after them', () => {
  const weight = measurement('weight', 'Weight', 'kg', { favorite: true })
  const muscle = measurement('muscle', 'Muscle Mass', 'kg', { favorite: true })
  const water = measurement('water', 'Water', 'kg')
  const waist = measurement('waist', 'Waist', 'cm')

  const options = buildBodyWeightAssignmentOptions(
    [muscle, weight],
    [muscle, waist, water, weight],
  )

  assert.deepEqual(options.map((item) => item.id), ['muscle', 'weight', 'water'])
})

test('body weight assignment only includes real kg measurements', () => {
  const options = buildBodyWeightAssignmentOptions([], [
    measurement('weight', 'Weight', 'kg'),
    measurement('waist', 'Waist', 'cm'),
    { id: 'placeholder', name: 'Body Weight', unit: 'kg' },
  ])

  assert.deepEqual(options.map((item) => item.id), ['weight'])
})

test('explicit assignment overrides automatic body weight detection', () => {
  const native = {
    id: 'body-weight',
    name: 'Body Weight',
    unit: 'kg',
    sourceType: 'bodyWeight',
    sourceField: 'bodyWeightMetric',
  }
  const custom = measurement('morning-weight', 'Morning Weight', 'kg')

  assert.equal(resolveBodyWeightMeasurement([native, custom], 'morning-weight')?.id, 'morning-weight')
})

test('placeholder body weight without a stored source still requires assignment', () => {
  const placeholder = { id: 'body-weight', name: 'Body Weight', unit: 'kg' }
  const custom = measurement('scale', 'Scale Weight', 'kg')

  assert.equal(resolveBodyWeightMeasurement([placeholder], ''), null)
  assert.equal(resolveBodyWeightMeasurement([placeholder, custom], '')?.id, undefined)
})


test('stale explicit assignment requires a new body weight assignment', () => {
  const native = {
    id: 'body-weight',
    name: 'Body Weight',
    unit: 'kg',
    sourceType: 'bodyWeight',
    sourceField: 'bodyWeightMetric',
  }

  assert.equal(resolveBodyWeightMeasurement([native], 'deleted-measurement'), null)
})

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


test('synthetic empty body weight does not block assignment after the measurement is deleted', () => {
  const synthetic = {
    id: 'body-weight',
    name: 'Body Weight',
    unit: 'kg',
    value: null,
    sourceType: 'bodyWeight',
    sourceField: 'bodyWeightMetric',
    bodyDefinitionExists: false,
  }
  const scale = measurement('scale-weight', 'Scale Weight', 'kg')

  assert.equal(resolveBodyWeightMeasurement([synthetic, scale], ''), null)
  assert.deepEqual(buildBodyWeightAssignmentOptions([], [synthetic, scale]).map((item) => item.id), ['scale-weight'])
})

test('defined Body Weight measurement is still detected automatically', () => {
  const bodyWeight = {
    id: 'measurement-1',
    name: 'Body Weight',
    unit: 'kg',
    value: null,
    sourceType: 'measurement',
    sourceId: 1,
    bodyDefinitionExists: true,
  }

  assert.equal(resolveBodyWeightMeasurement([bodyWeight], '')?.id, 'measurement-1')
})
