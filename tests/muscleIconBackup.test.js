import assert from 'node:assert/strict'
import test from 'node:test'
import { createFitNotesCsvExport } from '../src/fitnotes/createFitNotesCsvExport.js'
import { parseFitNotesCsv } from '../src/fitnotes/parseFitNotesCsv.js'

test('CSV restores icon choices and colours including unused muscles', verifyCsv)

function verifyCsv() {
  const categories = [
    { id: 1, name: 'Chest', colour: -65536, sortOrder: 0, iconId: 'lats' },
    { id: 'local-abs', name: 'Abs', colour: -16776961, sortOrder: 1, iconId: '' },
  ]
  const data = {
    categories,
    exercises: [{ id: 1, name: 'Press', categoryId: 1 }],
    workoutSets: [{ id: 1, exerciseId: 1, date: '2026-10-17', weight: 50, reps: 8 }],
  }
  const restored = restore(data)
  assert.equal(restored.categories[0].iconId, 'lats')
  assert.equal(restored.categories[1].iconId, '')
  assert.equal(restored.categories[0].colour, -65536)
  assert.equal(restored.categories[1].colour, -16776961)
  assert.equal(restored.exercises[0].categoryId, restored.categories[0].id)
  assert.deepEqual(restore(restored).categories, restored.categories)
  const musclesOnly = restore({ categories })
  assert.equal(musclesOnly.categories.length, 2)
  assert.equal(musclesOnly.categories[1].iconId, '')
  assert.equal(musclesOnly.workoutSets.length, 0)
}

test('old CSV files without icon data retain automatic default behaviour', verifyLegacy)

function verifyLegacy() {
  const text = 'Date,Exercise,Category,Weight,Reps\n2026-10-17,Crunch,Abs,20,10\n'
  const restored = parseFitNotesCsv({ name: 'old.csv' }, text)
  assert.equal(restored.categories[0].iconId, undefined)
}

function restore(data) {
  return parseFitNotesCsv({ name: 'icons.csv' }, createFitNotesCsvExport(data))
}
