import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseFitNotesCsv } from '../src/fitnotes/parseFitNotesCsv.js'
import { createFitNotesCsvExport } from '../src/fitnotes/createFitNotesCsvExport.js'

function parse(distance, unit) {
  return parseFitNotesCsv({ name: 'workouts.csv' },
    `Date,Exercise,Distance,Distance Unit\n2026-09-16,Run,${distance},${unit}\n`)
}

for (const [distance, unit, expected] of [[3, 'miles', 4.828032], [3, 'MI', 4.828032], [400, 'm', 0.4], [100, 'yards', 0.09144], [5, 'km', 5], [5, '', 5]]) {
  test(`preserves ${distance} ${unit || 'default km'} through CSV export and reimport`, () => {
    const parsed = parse(distance, unit)
    assert.equal(parsed.workoutSets[0].distance, expected)
    const exported = createFitNotesCsvExport(parsed)
    assert.equal(parseFitNotesCsv({ name: 'export.csv' }, exported).workoutSets[0].distance, expected)
  })
}

test('rejects unknown distance units rather than silently treating them as kilometres', () => {
  assert.throws(() => parse(3, 'unknown'), /unsupported distance unit/)
})
