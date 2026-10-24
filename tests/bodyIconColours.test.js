import assert from 'node:assert/strict'
import test from 'node:test'
import { BODY_ICON_COLOUR_KEY, normalizeBodyIconColour, readBodyIconColour, resolveBodyIconColour, saveBodyIconColour } from '../src/shared/models/bodyIconColours.js'

test('Body icons follow the current accent by default and allow an independent custom colour', verifyModes)
function verifyModes() {
  assert.deepEqual(readBodyIconColour(undefined), { mode: 'accent', customColour: '#4b9cff' })
  assert.equal(resolveBodyIconColour(undefined, '#a487ff'), '#a487ff')
  const custom = { mode: 'custom', customColour: '#55bd8c' }
  assert.equal(resolveBodyIconColour(custom, '#a487ff'), '#55bd8c')
  assert.equal(resolveBodyIconColour(custom, '#ed78ae'), '#55bd8c')
  assert.deepEqual(normalizeBodyIconColour({ mode: 'unknown', customColour: 'invalid' }), { mode: 'accent', customColour: '#4b9cff' })
}

test('persists Body icon colour without modifying muscle or accent preferences', verifyStorage)
function verifyStorage() {
  const values = new Map([['fitnotes-viewer-accent-colour', '#a487ff'], ['muscle-colour', 'unchanged']])
  const storage = { getItem(key) { return values.get(key) }, setItem(key, value) { values.set(key, value) } }
  saveBodyIconColour(storage, { mode: 'custom', customColour: '#ED78AE' })
  assert.deepEqual(readBodyIconColour(storage), { mode: 'custom', customColour: '#ed78ae' })
  saveBodyIconColour(storage, { mode: 'accent', customColour: '#ed78ae' })
  assert.deepEqual(readBodyIconColour(storage), { mode: 'accent', customColour: '#ed78ae' })
  assert.equal(values.get('fitnotes-viewer-accent-colour'), '#a487ff')
  assert.equal(values.get('muscle-colour'), 'unchanged')
  values.set(BODY_ICON_COLOUR_KEY, 'invalid json')
  assert.equal(readBodyIconColour(storage).mode, 'accent')
}

test('handles unavailable local storage safely', verifyBlocked)
function verifyBlocked() {
  const storage = { getItem() { throw new Error('Blocked') }, setItem() { throw new Error('Blocked') } }
  assert.equal(readBodyIconColour(storage).mode, 'accent')
  saveBodyIconColour(storage, { mode: 'custom', customColour: '#55bd8c' })
}
