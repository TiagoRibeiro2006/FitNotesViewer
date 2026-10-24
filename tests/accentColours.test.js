import assert from 'node:assert/strict'
import test from 'node:test'
import { ACCENT_COLOURS, ACCENT_STORAGE_KEY, DEFAULT_ACCENT, normalizeAccentColour, readAccentColour, saveAccentColour, applyAccentColour, accentTextColour } from '../src/shared/models/accentColours.js'

test('defaults to blue and accepts valid custom colours only', verifyValidation)
function verifyValidation() {
  assert.equal(readAccentColour(undefined), DEFAULT_ACCENT)
  assert.equal(normalizeAccentColour('#AB12EF'), '#ab12ef')
  for (const value of [null, '', 'red', '#fff', '#12345678', 'url(test)', '#ZZ1122']) {
    assert.equal(normalizeAccentColour(value), DEFAULT_ACCENT)
  }
  for (const option of ACCENT_COLOURS) assert.equal(normalizeAccentColour(option.colour), option.colour)
}

test('persists the accent separately from the theme and handles storage errors', verifyPersistence)
function verifyPersistence() {
  const values = new Map([['fitnotes-viewer-theme', 'soft']])
  const storage = {
    getItem(key) { return values.get(key) },
    setItem(key, value) { values.set(key, value) },
  }
  saveAccentColour(storage, '#ac12ef')
  assert.equal(readAccentColour(storage), '#ac12ef')
  assert.equal(values.get('fitnotes-viewer-theme'), 'soft')
  assert.equal(values.get(ACCENT_STORAGE_KEY), '#ac12ef')
  const blocked = { getItem() { throw new Error('Blocked') }, setItem() { throw new Error('Blocked') } }
  assert.equal(readAccentColour(blocked), DEFAULT_ACCENT)
  saveAccentColour(blocked, '#ac12ef')
}

test('updates highlights across themes without changing muscle or Body icon colours', verifyApplication)
function verifyApplication() {
  const styles = new Map([['--category-color', '#4b9cff']])
  const document = { documentElement: { dataset: { theme: 'dark' }, style: { setProperty(key, value) { styles.set(key, value) } } } }
  for (const theme of ['dark', 'light', 'soft']) {
    document.documentElement.dataset.theme = theme
    applyAccentColour(document, '#a487ff')
    assert.equal(styles.get('--accent-colour'), '#a487ff')
    assert.equal(styles.get('--accent-rgb'), '164, 135, 255')
    assert.equal(styles.get('--accent-ink'), accentTextColour('#a487ff', theme !== 'dark'))
    assert.equal(styles.get('--category-color'), '#4b9cff')
  }
  applyAccentColour(undefined, '#a487ff')
}

test('keeps custom black and white accents legible on both theme types', verifyContrast)
function verifyContrast() {
  assert.notEqual(accentTextColour('#000000', false), '#000000')
  assert.notEqual(accentTextColour('#ffffff', true), '#ffffff')
  assert.equal(accentTextColour('#000000', true), '#000000')
  assert.equal(accentTextColour('#ffffff', false), '#ffffff')
}
