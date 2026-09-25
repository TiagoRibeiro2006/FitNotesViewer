import assert from 'node:assert/strict'
import test from 'node:test'
import {
  convertRepMaxWeightInput,
  nextRepMaxWeightUnit,
} from '../src/features/workouts/oneRepMaxUnitConverter.js'

test('toggles the 1RM calculator between kilograms and pounds', () => {
  assert.equal(nextRepMaxWeightUnit('kg'), 'lb')
  assert.equal(nextRepMaxWeightUnit('lb'), 'kg')
})

test('converts the current 1RM weight input when toggled', () => {
  assert.equal(convertRepMaxWeightInput('100', 'kg', 'lb'), '220.462')
  assert.equal(convertRepMaxWeightInput('220.462', 'lb', 'kg'), '100')
})

test('keeps blank and incomplete calculator input safe', () => {
  assert.equal(convertRepMaxWeightInput('', 'kg', 'lb'), '')
  assert.equal(convertRepMaxWeightInput('not-a-number', 'kg', 'lb'), 'not-a-number')
})
