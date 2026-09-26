import assert from 'node:assert/strict'
import test from 'node:test'
import { consumeAppUpdateNotice } from '../src/app/serviceWorker.js'

test('consumes the app update notice only once', () => {
  const originalSessionStorage = globalThis.sessionStorage
  const values = new Map([['fitnotes-viewer-update-notice', 'true']])
  globalThis.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
  }

  try {
    assert.equal(consumeAppUpdateNotice(), true)
    assert.equal(consumeAppUpdateNotice(), false)
  } finally {
    if (originalSessionStorage === undefined) delete globalThis.sessionStorage
    else globalThis.sessionStorage = originalSessionStorage
  }
})

test('ignores unavailable session storage', () => {
  const originalSessionStorage = globalThis.sessionStorage
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    get() { throw new Error('Storage unavailable') },
  })

  try {
    assert.equal(consumeAppUpdateNotice(), false)
  } finally {
    if (originalSessionStorage === undefined) delete globalThis.sessionStorage
    else Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
      writable: true,
    })
  }
})
