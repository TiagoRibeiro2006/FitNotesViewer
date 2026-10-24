import assert from 'node:assert/strict'
import test from 'node:test'

test('progress stars default on, toggle independently and persist without touching workout data', verifyPreferences)

async function verifyPreferences(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map([['workout-data', 'unchanged']])
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem(key) { return values.get(key) ?? null },
    setItem(key, value) { values.set(key, value) },
  } })
  t.after(restore)
  let module = await import('../src/shared/composables/useProgressAppearance.js?initial')
  let preferences = module.useProgressAppearance()
  assert.equal(preferences.homeProgressEnabled.value, true)
  assert.equal(preferences.editorProgressEnabled.value, true)
  preferences.setHomeProgressEnabled(false)
  assert.equal(preferences.editorProgressEnabled.value, true)
  module = await import('../src/shared/composables/useProgressAppearance.js?reload')
  preferences = module.useProgressAppearance()
  assert.equal(preferences.homeProgressEnabled.value, false)
  preferences.setEditorProgressEnabled(false)
  preferences.setHomeProgressEnabled(true)
  module = await import('../src/shared/composables/useProgressAppearance.js?reload-again')
  preferences = module.useProgressAppearance()
  assert.equal(preferences.homeProgressEnabled.value, true)
  assert.equal(preferences.editorProgressEnabled.value, false)
  assert.equal(values.get('workout-data'), 'unchanged')

  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: blocked })
  module = await import('../src/shared/composables/useProgressAppearance.js?blocked')
  preferences = module.useProgressAppearance()
  preferences.setHomeProgressEnabled(false)
  preferences.setEditorProgressEnabled(false)
  assert.equal(preferences.homeProgressEnabled.value, false)
  assert.equal(preferences.editorProgressEnabled.value, false)

  function blocked() { throw new Error('Unavailable') }
  function restore() {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  }
}
