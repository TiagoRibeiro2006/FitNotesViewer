import assert from 'node:assert/strict'
import test from 'node:test'
import {
  KILOGRAMS,
  POUNDS,
  convertWeight,
  displayWeight,
  isWeightUnit,
  normalizeWeightUnit,
  storeWeight,
} from '../src/shared/units/weightUnits.js'

test('normalizes supported weight unit names', () => {
  assert.equal(normalizeWeightUnit('kg'), KILOGRAMS)
  assert.equal(normalizeWeightUnit('kgs'), KILOGRAMS)
  assert.equal(normalizeWeightUnit('lb'), POUNDS)
  assert.equal(normalizeWeightUnit('LBS'), POUNDS)
  assert.equal(normalizeWeightUnit('pounds'), POUNDS)
})

test('converts kilograms and pounds in both directions', () => {
  assert.equal(Math.round(displayWeight(100, POUNDS) * 10) / 10, 220.5)
  assert.equal(Math.round(convertWeight(220.462262, POUNDS, KILOGRAMS)), 100)
})

test('stores pound input as kilograms without losing the round trip', () => {
  const storedKilograms = storeWeight('220.462262', POUNDS)
  const displayedPounds = displayWeight(storedKilograms, POUNDS)

  assert.equal(storedKilograms, 100)
  assert.equal(Math.round(displayedPounds * 1000) / 1000, 220.462)
})

test('preserves valid zero weights and rejects blank or invalid values', () => {
  assert.equal(storeWeight(0, POUNDS), 0)
  assert.equal(storeWeight('', POUNDS), null)
  assert.equal(storeWeight('invalid', POUNDS), null)
})

test('recognizes body measurement weight units', () => {
  assert.equal(isWeightUnit('kg'), true)
  assert.equal(isWeightUnit('lbs'), true)
  assert.equal(isWeightUnit('cm'), false)
  assert.equal(isWeightUnit('%'), false)
})
