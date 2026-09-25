import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseFitNotesFile } from '../src/fitnotes/parseFitNotesFile.js'
import { readFitNotesFileBytes } from '../src/fitnotes/readFitNotesFileBytes.js'
import { isSqliteDatabase } from '../src/fitnotes/fitNotesValidation.js'

const csv = new TextEncoder().encode('Date,Exercise,Category,Weight,Weight Unit,Reps,Distance,Distance Unit,Time\n2025-09-22,Push Press,Shoulders,40.0,kgs,8,,,\n')

function fileReturning(bytes, size = bytes.byteLength, name = 'android.csv') {
  return { name, size, arrayBuffer: async () => bytes.buffer }
}

function fallbackReader(t, bytes) {
  const original = globalThis.FileReader
  t.after(() => { globalThis.FileReader = original })
  globalThis.FileReader = class {
    readAsArrayBuffer() {
      this.result = bytes.buffer
      queueMicrotask(() => this.onload())
    }
  }
}

// Node has Blob but no browser FileReader. Install only a test placeholder.
globalThis.FileReader = class { constructor() { throw new Error('Unexpected fallback') } }

test('reads a complete Android CSV without fallback', async () => {
  const { parsed } = await parseFitNotesFile(fileReturning(csv))
  assert.equal(parsed.summary.totalSets, 1)
  assert.equal(parsed.workoutSets[0].weight, 40)
})

test('retries an empty arrayBuffer using FileReader before parsing CSV', async (t) => {
  fallbackReader(t, csv)
  const { parsed } = await parseFitNotesFile(fileReturning(new Uint8Array(), csv.length))
  assert.equal(parsed.summary.totalSets, 1)
})

test('retries incomplete content instead of importing a partial workout', async (t) => {
  fallbackReader(t, csv)
  const { bytes } = await parseFitNotesFile(fileReturning(csv.slice(0, 10), csv.length))
  assert.deepEqual(bytes, csv)
})

test('retries a rejected arrayBuffer read', async (t) => {
  fallbackReader(t, csv)
  const file = { ...fileReturning(csv), arrayBuffer: async () => { throw new Error('NotReadableError') } }
  assert.equal((await parseFitNotesFile(file)).parsed.summary.totalSets, 1)
})

test('reads content when a provider reports an unknown zero size', async () => {
  assert.equal((await parseFitNotesFile(fileReturning(csv, 0))).parsed.summary.totalSets, 1)
})

test('empty CSV and backup reads report a file access error, never a CSV error', async (t) => {
  fallbackReader(t, new Uint8Array())
  for (const name of ['android.csv', 'android.fitnotes']) {
    await assert.rejects(parseFitNotesFile(fileReturning(new Uint8Array(), 100, name)), /could not be read completely/)
  }
})

test('a non-SQLite backup cannot fall through to the CSV parser', async () => {
  await assert.rejects(parseFitNotesFile(fileReturning(csv, csv.length, 'android.fitnotes')), /valid SQLite/)
})

test('fallback preserves SQLite binary bytes and signature', async (t) => {
  const sqlite = new Uint8Array([...new TextEncoder().encode('SQLite format 3\0'), 0, 255, 128])
  fallbackReader(t, sqlite)
  const bytes = await readFitNotesFileBytes(fileReturning(new Uint8Array(), sqlite.length, 'android.fitnotes'))
  assert.deepEqual(bytes, sqlite)
  assert.equal(isSqliteDatabase(bytes), true)
})

test('a genuinely header-only CSV still reports no workout sets', async () => {
  const header = new TextEncoder().encode('Date,Exercise,Reps\n')
  await assert.rejects(parseFitNotesFile(fileReturning(header)), /does not contain any workout sets/)
})
