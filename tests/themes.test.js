import assert from 'node:assert/strict'
import test from 'node:test'
import { applyTheme, normalizeTheme, readTheme, saveTheme, THEMES, THEME_STORAGE_KEY } from '../src/shared/models/themes.js'

test('offers exactly three themes and defaults to the original dark theme', verifyDefaults)

function verifyDefaults() {
  assert.equal(THEMES.length, 3)
  for (const theme of THEMES) assert.equal(normalizeTheme(theme.id), theme.id)
  for (const value of [null, undefined, '', 'system', 'unknown']) {
    assert.equal(normalizeTheme(value), 'dark')
  }
  assert.equal(readTheme(undefined), 'dark')
}

test('saves and restores every theme without changing other preferences', verifyPersistence)

function verifyPersistence() {
  const values = new Map([['other-setting', 'unchanged']])
  const storage = {
    getItem(key) { return values.get(key) },
    setItem(key, value) { values.set(key, value) },
  }
  for (const theme of THEMES) {
    saveTheme(storage, theme.id)
    assert.equal(readTheme(storage), theme.id)
  }
  saveTheme(storage, 'invalid')
  assert.equal(values.get(THEME_STORAGE_KEY), 'dark')
  assert.equal(values.get('other-setting'), 'unchanged')
}

test('remains usable when local storage is unavailable', verifyStorageFailure)

function verifyStorageFailure() {
  const storage = {
    getItem() { throw new Error('Unavailable') },
    setItem() { throw new Error('Unavailable') },
  }
  assert.equal(readTheme(storage), 'dark')
  assert.doesNotThrow(save)
  function save() { saveTheme(storage, 'light') }
}

test('applies themes to the entire document and updates browser colours', verifyApplication)

function verifyApplication() {
  const values = new Map()
  const document = {
    documentElement: { dataset: {} },
    querySelector(selector) {
      return { setAttribute(name, value) { values.set(selector, value) } }
    },
  }
  const colours = { dark: '#000000', light: '#f5f7fa', soft: '#efedf7' }
  for (const theme of THEMES) {
    applyTheme(document, theme.id)
    assert.equal(document.documentElement.dataset.theme, theme.id)
    assert.equal(values.get('meta[name="theme-color"]'), colours[theme.id])
    assert.equal(values.get('meta[name="color-scheme"]'), theme.id === 'dark' ? 'dark' : 'light')
  }
  applyTheme(document, 'invalid')
  assert.equal(document.documentElement.dataset.theme, 'dark')
  applyTheme(undefined, 'light')
}
