import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'
import 'fake-indexeddb/auto'

test('automatic backups persist preferences, respect intervals and rotate only after a successful write', async (t) => {
  const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null, hmr: false }, optimizeDeps: { noDiscovery: true, entries: [] }, appType: 'custom', logLevel: 'silent' })
  t.after(() => server.close())
  const service = await server.ssrLoadModule('/src/features/settings/services/automaticBackupService.js')
  const repository = await server.ssrLoadModule('/src/data/repositories/automaticBackupRepository.js')
  const now = Date.parse('2026-10-31T12:00:00Z')
  assert.equal(service.backupIsDue({ intervalDays: 1, lastBackupAt: '2026-10-30T12:00:00Z' }, now), true)
  assert.equal(service.backupIsDue({ intervalDays: 1, lastBackupAt: '2026-10-30T12:00:01Z' }, now), false)
  assert.equal(service.backupIsDue({ intervalDays: 30, lastBackupAt: '2026-10-02T12:00:00Z' }, now), false)
  assert.equal(service.backupIsDue({ intervalDays: 1, lastBackupAt: null }, now), true)
  assert.equal(service.backupIsDue({ intervalDays: 1, lastBackupAt: '2026-11-01' }, now), false)

  await repository.updateBackupPreferences({ enabled: true, intervalDays: 3 })
  await repository.updateBackupPreferences({ keepLatestOnly: true })
  const saved = await repository.readBackupPreferences()
  assert.equal(saved.enabled, true)
  assert.equal(saved.intervalDays, 3)
  assert.equal(saved.keepLatestOnly, true)

  const events = []
  const directory = {
    async getFileHandle() {
      return {
        async createWritable() { return { async write() { events.push('write') }, async close() { events.push('close') } } },
        async getFile() { events.push('verify'); return new Blob(['abc']) },
      }
    },
    async removeEntry(name) { events.push(name) },
  }
  await service.writeAutomaticBackup(directory, { data: 'abc' }, 'new.csv')
  await service.removeOlderBackups(directory, ['unrelated.csv', 'FitNotes_Auto_previous.csv'])
  assert.deepEqual(events, ['write', 'close', 'verify', 'FitNotes_Auto_previous.csv'])

  const corruptDirectory = { async getFileHandle() { return {
    async createWritable() { return { async write() {}, async close() {} } },
    async getFile() { return new Blob(['xyz']) },
  } } }
  await assert.rejects(service.writeAutomaticBackup(corruptDirectory, { data: 'abc' }, 'new.csv'), /verified/)

  let aborted = false
  const brokenDirectory = { async getFileHandle() { return { async createWritable() { return {
    async write() { throw new Error('Disk full') }, async close() {}, async abort() { aborted = true },
  } } } } }
  await assert.rejects(service.writeAutomaticBackup(brokenDirectory, { data: 'abc' }, 'new.csv'), /Disk full/)
  assert.equal(aborted, true)
  const failedCleanup = { async removeEntry() { throw new Error('Access denied') } }
  assert.deepEqual(await service.removeOlderBackups(failedCleanup, ['FitNotes_Auto_previous.csv']), ['FitNotes_Auto_previous.csv'])
})
