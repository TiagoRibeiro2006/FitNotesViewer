import assert from 'node:assert/strict'
import { test } from 'node:test'
import { useAppInitialization } from '../src/app/useAppInitialization.js'

let moduleId = 0
async function connectionHarness(t) {
  const previous = globalThis.indexedDB
  const requests = []
  globalThis.indexedDB = { open() { const request = {}; requests.push(request); return request } }
  t.after(() => { globalThis.indexedDB = previous })
  const { openAppDatabase } = await import(`../src/data/indexedDb/database.js?test=${moduleId++}`)
  function succeed(request) {
    const db = { closed: false, close() { this.closed = true } }
    request.result = db
    request.onsuccess()
    return db
  }
  return { requests, openAppDatabase, succeed }
}

test('failed IndexedDB opening can be retried without reloading the page', async (t) => {
  const { requests, openAppDatabase, succeed } = await connectionHarness(t)
  const failed = openAppDatabase()
  assert.equal(openAppDatabase(), failed, 'share concurrent attempts')
  requests[0].error = new Error('Storage unavailable')
  requests[0].onerror()
  await assert.rejects(failed, /Storage unavailable/)
  const retry = openAppDatabase()
  assert.equal(requests.length, 2)
  const db = succeed(requests[1])
  assert.equal(await retry, db)
  assert.equal(await openAppDatabase(), db)
})

test('a blocked attempt closes its late connection without invalidating a successful retry', async (t) => {
  const { requests, openAppDatabase, succeed } = await connectionHarness(t)
  const blocked = openAppDatabase()
  requests[0].onblocked()
  await assert.rejects(blocked, /Close other app windows/)
  const retry = openAppDatabase()
  const db = succeed(requests[1])
  await retry
  assert.equal(succeed(requests[0]).closed, true)
  assert.equal(await openAppDatabase(), db)
})

test('version changes and unexpected connection closes allow reopening', async (t) => {
  const { requests, openAppDatabase, succeed } = await connectionHarness(t)
  const first = openAppDatabase()
  const db = succeed(requests[0])
  await first
  db.onversionchange()
  assert.equal(db.closed, true)
  const second = openAppDatabase()
  const next = succeed(requests[1])
  await second
  next.onclose()
  const third = openAppDatabase()
  assert.equal(requests.length, 3)
  succeed(requests[2])
  await third
})

test('startup exposes storage errors, keeps the app unavailable and recovers on retry', async () => {
  let fail = true
  let backgroundStarts = 0
  const saved = { totalSets: 42, isEmpty: false }
  const state = useAppInitialization(async () => {
    if (fail) throw new Error('Storage unavailable')
    return saved
  }, () => { backgroundStarts++ })
  await state.initializeApp()
  assert.equal(state.appReady.value, false)
  assert.match(state.initializationError.value, /Storage unavailable/)
  assert.equal(state.initializing.value, false)
  assert.equal(backgroundStarts, 0)
  fail = false
  await state.initializeApp()
  assert.equal(state.appReady.value, true)
  assert.deepEqual(state.summary.value, saved)
  assert.equal(state.initializationError.value, '')
  assert.equal(backgroundStarts, 1)
})

test('multiple retry clicks do not start overlapping initialization', async () => {
  let resolve
  let loads = 0
  const state = useAppInitialization(() => {
    loads++
    return new Promise((done) => { resolve = done })
  }, () => {})
  const first = state.initializeApp()
  await state.initializeApp()
  assert.equal(loads, 1)
  assert.equal(state.initializing.value, true)
  resolve({ isEmpty: true })
  await first
  assert.equal(state.appReady.value, true)
})
