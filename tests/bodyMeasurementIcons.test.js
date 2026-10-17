import assert from 'node:assert/strict'
import test from 'node:test'
import { bodyMeasurementIcon } from '../src/features/body/bodyMeasurementIcons.js'

test('assigns muscle icons to default body measurements and both sides', verifyMuscles)

function verifyMuscles() {
  assert.equal(bodyMeasurementIcon('Bicep Arm (Left)'), 'biceps')
  assert.equal(bodyMeasurementIcon('Bicep Arm (Right)'), 'biceps')
  assert.equal(bodyMeasurementIcon('Upper Arm (Left)'), 'biceps')
  assert.equal(bodyMeasurementIcon('Forearm (Right)'), 'forearm')
  assert.equal(bodyMeasurementIcon('Thigh (Left)'), 'quads')
  assert.equal(bodyMeasurementIcon('Calf (Right)'), 'calfs')
  assert.equal(bodyMeasurementIcon('Shoulders'), 'side-delts')
  assert.equal(bodyMeasurementIcon('Chest'), 'chest')
  assert.equal(bodyMeasurementIcon('Glúteos'), 'glutes')
}

test('leaves non-muscle measurements without an icon', verifyOtherMeasurements)

function verifyOtherMeasurements() {
  for (const name of ['Body Fat', 'Bodyweight', 'Body Weight', 'Muscle Mass', 'Visceral Fat', 'Neck', 'Waist', 'Hips', 'Height', 'Waist Vácuo']) {
    assert.equal(bodyMeasurementIcon(name), '')
  }
}
