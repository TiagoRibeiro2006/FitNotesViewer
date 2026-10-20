import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import 'fake-indexeddb/auto'
import { BODY_ICON_IDS, resolveMuscleIcon } from '../src/shared/models/muscleIcons.js'
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

test('shares every body icon with muscles and respects explicit body choices', verifyChoices)

function verifyChoices() {
  for (const iconId of BODY_ICON_IDS) {
    assert.equal(resolveMuscleIcon('Chest', iconId), iconId)
    assert.equal(bodyMeasurementIcon('Custom', iconId), iconId)
  }
  assert.equal(bodyMeasurementIcon('Body Fat', ''), '')
  assert.equal(bodyMeasurementIcon('Body Fat', 'biceps'), 'biceps')
}

test('persists body icon edits and no-icon choices across tracker reloads', verifyBodyPersistence)

async function verifyBodyPersistence(t) {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true, entries: [] },
    appType: 'custom',
    logLevel: 'silent',
  })
  t.after(closeServer)
  const repository = await server.ssrLoadModule('/src/data/repositories/bodyRepository.js')
  const connection = await server.ssrLoadModule('/src/data/indexedDb/database.js')
  const database = await connection.openAppDatabase()
  t.after(closeDatabase)
  let data = await repository.getBodyTrackerData()
  const item = data.measurements.find(isNeck)
  assert.ok(item)
  await repository.updateBodyMeasurementName(item, item.name, 'body-fat')
  data = await repository.getBodyTrackerData()
  assert.equal(data.measurements.find(isNeck).iconId, 'body-fat')
  await repository.updateBodyMeasurementName(item, item.name, '')
  data = await repository.getBodyTrackerData()
  assert.equal(data.measurements.find(isNeck).iconId, '')
  await repository.updateBodyMeasurementName(item, 'Custom Neck')
  data = await repository.getBodyTrackerData()
  assert.equal(data.measurements.find(isNeck).iconId, '')

  function isNeck(candidate) {
    return candidate.name === 'Neck' || candidate.name === 'Custom Neck'
  }
  function closeServer() {
    return server.close()
  }
  function closeDatabase() {
    database.close()
  }
}
