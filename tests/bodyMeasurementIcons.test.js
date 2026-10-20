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

test('assigns the dedicated body measurement icons', verifyBodyIcons)

function verifyBodyIcons() {
  assert.equal(bodyMeasurementIcon('Body Fat'), 'body-fat')
  assert.equal(bodyMeasurementIcon('Muscle Mass'), 'muscle-mass')
  assert.equal(bodyMeasurementIcon('Bodyweight'), 'body-weight')
  assert.equal(bodyMeasurementIcon('Body Weight'), 'body-weight')
  assert.equal(bodyMeasurementIcon('Height'), 'height')
  assert.equal(bodyMeasurementIcon('Neck'), 'neck')
  assert.equal(bodyMeasurementIcon('Waist'), 'waist-normal')
  assert.equal(bodyMeasurementIcon('Waist Normal'), 'waist-normal')
  assert.equal(bodyMeasurementIcon('Waist Vácuo'), 'waist-vacuum')
  assert.equal(bodyMeasurementIcon('Waist Vacuum'), 'waist-vacuum')
  assert.equal(bodyMeasurementIcon('Visceral Fat'), 'visceral-fat')
}

test('leaves unassigned measurements without an icon', verifyOtherMeasurements)

function verifyOtherMeasurements() {
  for (const name of ['Hips', 'Custom measurement']) {
    assert.equal(bodyMeasurementIcon(name), '')
  }
}
