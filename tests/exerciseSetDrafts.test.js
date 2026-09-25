import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createNextSetDraft,
  createSetDrafts,
  createStoredSetDrafts,
  updateSetDraftWeight,
} from '../src/features/workouts/exerciseSetDrafts.js'
import { POUNDS, storeWeight } from '../src/shared/units/weightUnits.js'

test('keeps the original kilogram value when a pound draft is not edited', () => {
  const drafts = createSetDrafts([{ weight: 100, reps: 8 }], POUNDS)

  assert.equal(drafts[0].weight, '220.462')
  assert.equal(createStoredSetDrafts(drafts, POUNDS)[0].weight, 100)
})

test('converts an edited pound draft back to kilograms', () => {
  const drafts = createSetDrafts([{ weight: 100, reps: 8 }], POUNDS)

  updateSetDraftWeight(drafts[0], '225')

  assert.equal(
    createStoredSetDrafts(drafts, POUNDS)[0].weight,
    storeWeight(225, POUNDS),
  )
})

test('new sets preserve the conversion state of the source set', () => {
  const drafts = createSetDrafts([{ weight: 80, reps: 10 }], POUNDS)
  const next = createNextSetDraft(drafts, [])

  assert.equal(next.weight, drafts[0].weight)
  assert.equal(next.storedWeight, 80)
  assert.equal(next.weightEdited, false)
})
