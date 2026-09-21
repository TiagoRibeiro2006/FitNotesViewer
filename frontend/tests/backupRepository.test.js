import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createServer } from 'vite'
import 'fake-indexeddb/auto'
import initSqlJs from 'sql.js'
import { readFitNotesDatabase } from '../src/fitnotes/readFitNotesDatabase.js'
import { synchronizeFitNotesData } from '../src/fitnotes/synchronizeFitNotesData.js'

test('repository export includes local catalog changes and relationships from a single snapshot', async (t) => {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true, entries: [] },
    appType: 'custom',
    logLevel: 'silent',
  })
  t.after(() => server.close())
  const backup = await server.ssrLoadModule('/src/data/repositories/backupRepository.js')
  const catalog = await server.ssrLoadModule('/src/data/repositories/catalogRepository.js')
  const workouts = await server.ssrLoadModule('/src/data/repositories/workoutRepository.js')
  const connection = await server.ssrLoadModule('/src/data/indexedDb/database.js')
  t.after(async () => (await connection.openAppDatabase()).close())
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  t.after(() => db.close())
  db.run(readFileSync(new URL('./fixtures/fitnotes-schema.sql', import.meta.url), 'utf8'))
  db.run(`INSERT INTO Category (_id, name) VALUES (1, 'Chest');
    INSERT INTO exercise (_id, name, category_id) VALUES (1, 'Press', 1);`)
  const bytes = db.export()
  const parsed = readFitNotesDatabase({ name: 'test.fitnotes' }, db)
  await backup.saveFitNotesImport(parsed, { name: 'test.fitnotes', size: bytes.length }, bytes)
  await catalog.updateExerciseDetails(1, { name: 'Bench Press', categoryId: 1 })
  const category = await catalog.createCategoryDetails({ name: 'Back', colour: 123 })
  const { exercise } = await catalog.createExerciseDetails({ name: 'Row', categoryId: category.id })
  await workouts.saveWorkoutExercise('2026-09-22', exercise, [{ weight: 40, reps: 8 }])

  const snapshot = await backup.getFitNotesExportData()
  assert.ok(snapshot.exercises.some((row) => row.id === exercise.id))
  assert.ok(snapshot.categories.some((row) => row.id === category.id))
  assert.deepEqual(snapshot.bytes, bytes, 'stored original backup stays untouched')
  synchronizeFitNotesData(db, snapshot)
  const restored = readFitNotesDatabase({ name: 'export.fitnotes' }, db)
  assert.equal(restored.exercises.find((row) => row.id === 1).name, 'Bench Press')
  const row = restored.workoutSets[0]
  assert.equal(row.exerciseName, 'Row')
  assert.equal(row.weight, 40)
  assert.equal(row.reps, 8)
  const restoredExercise = restored.exercises.find((item) => item.id === row.exerciseId)
  assert.equal(restored.categories.find((item) => item.id === restoredExercise.categoryId).name, 'Back')
})
