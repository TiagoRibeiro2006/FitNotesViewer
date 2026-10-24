import assert from 'node:assert/strict'
import test from 'node:test'

const CHARTS_KEY = 'fitnotes-viewer-charts-icons'
const MUSCLE_KEY = 'fitnotes-viewer-muscle-icons'
const EXERCISE_LISTS_KEY = 'fitnotes-viewer-exercise-list-icons'
let moduleId = 0

async function appearance() {
  moduleId += 1
  const module = await import(`../src/shared/composables/useMuscleAppearance.js?chart-test=${moduleId}`)
  return module.useMuscleAppearance()
}

function storage(t, entries = []) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map(entries)
  const local = {
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, value) },
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: local })
  t.after(restore)
  function restore() {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else delete globalThis.localStorage
  }
  return { values, local }
}

test('enables chart icons by default without changing other page preferences', verifyDefaults)
async function verifyDefaults(t) {
  storage(t)
  const preferences = await appearance()
  assert.equal(preferences.chartIconsEnabled.value, true)
  preferences.setChartIconsEnabled(false)
  assert.equal(preferences.chartIconsEnabled.value, false)
  assert.equal(preferences.iconsEnabled.value, true)
  assert.equal(preferences.homeIndicatorsEnabled.value, true)
  assert.equal(preferences.bodyIconsEnabled.value, true)
}

test('inherits the previous muscle display choice until Charts has its own preference', verifyMigration)
async function verifyMigration(t) {
  const { values } = storage(t, [[MUSCLE_KEY, 'false']])
  const preferences = await appearance()
  assert.equal(preferences.chartIconsEnabled.value, false)
  preferences.setChartIconsEnabled(true)
  assert.equal(preferences.chartIconsEnabled.value, true)
  assert.equal(preferences.iconsEnabled.value, false)
  assert.equal(values.get(CHARTS_KEY), 'true')
}

test('persists chart visibility independently when global muscle appearance changes', verifyPersistence)
async function verifyPersistence(t) {
  storage(t)
  let preferences = await appearance()
  preferences.setChartIconsEnabled(false)
  preferences.setIconsEnabled(false)
  preferences.setIconsEnabled(true)
  preferences = await appearance()
  assert.equal(preferences.chartIconsEnabled.value, false)
  preferences.setChartIconsEnabled(true)
  preferences.setIconsEnabled(false)
  preferences = await appearance()
  assert.equal(preferences.chartIconsEnabled.value, true)
  assert.equal(preferences.iconsEnabled.value, false)
}

test('still toggles charts when local storage is blocked', verifyBlockedStorage)
async function verifyBlockedStorage(t) {
  const { local } = storage(t)
  local.getItem = blocked
  local.setItem = blocked
  const preferences = await appearance()
  assert.equal(preferences.chartIconsEnabled.value, true)
  preferences.setChartIconsEnabled(false)
  assert.equal(preferences.chartIconsEnabled.value, false)
  function blocked() { throw new Error('Storage unavailable') }
}

test('exercise list icons persist independently of Charts, Home, Body and global appearance', verifyExerciseLists)
async function verifyExerciseLists(t) {
  const { values } = storage(t)
  let preferences = await appearance()
  assert.equal(preferences.exerciseListIconsEnabled.value, true)
  preferences.setExerciseListIconsEnabled(false)
  assert.equal(preferences.chartIconsEnabled.value, true)
  assert.equal(preferences.homeIndicatorsEnabled.value, true)
  assert.equal(preferences.bodyIconsEnabled.value, true)
  assert.equal(preferences.iconsEnabled.value, true)
  assert.equal(values.get(EXERCISE_LISTS_KEY), 'false')
  preferences = await appearance()
  assert.equal(preferences.exerciseListIconsEnabled.value, false)
  preferences.setExerciseListIconsEnabled(true)
  preferences.setIconsEnabled(false)
  preferences = await appearance()
  assert.equal(preferences.exerciseListIconsEnabled.value, true)
  assert.equal(preferences.iconsEnabled.value, false)
}

test('exercise lists initially respect the previous global choice and work without storage', verifyExerciseListMigration)
async function verifyExerciseListMigration(t) {
  const { local } = storage(t, [[MUSCLE_KEY, 'false']])
  let preferences = await appearance()
  assert.equal(preferences.exerciseListIconsEnabled.value, false)
  local.getItem = blocked
  local.setItem = blocked
  preferences = await appearance()
  assert.equal(preferences.exerciseListIconsEnabled.value, true)
  preferences.setExerciseListIconsEnabled(false)
  assert.equal(preferences.exerciseListIconsEnabled.value, false)
  function blocked() { throw new Error('Storage unavailable') }
}
