import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import 'fake-indexeddb/auto'

test('lists muscle exercises and refreshes deletion eligibility after moving an exercise', verifyMuscleExercises)

async function verifyMuscleExercises(t) {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true, entries: [] },
    appType: 'custom',
    logLevel: 'silent',
  })
  t.after(closeServer)
  const repository = await server.ssrLoadModule('/src/data/repositories/catalogRepository.js')
  const connection = await server.ssrLoadModule('/src/data/indexedDb/database.js')
  const database = await connection.openAppDatabase()
  t.after(closeDatabase)
  const source = await repository.createCategoryDetails({ name: 'Source', colour: -65536, iconId: 'abs' })
  const target = await repository.createCategoryDetails({ name: 'Target', colour: -65536, iconId: '' })
  const created = await repository.createExerciseDetails({ name: 'Exercise', categoryId: source.id })
  const { useCatalogManager } = await server.ssrLoadModule('/src/features/workouts/composables/useCatalogManager.js')
  const manager = useCatalogManager()
  await manager.open('muscles')
  manager.select(source)
  assert.equal(manager.selectedMuscleExerciseCount.value, 1)
  assert.equal(manager.selectedMuscleExercises.value[0].id, created.exercise.id)
  assert.equal(manager.selectedMuscleExercises.value[0].categoryIcon, 'abs')
  await repository.updateExerciseDetails(created.exercise.id, { name: 'Moved exercise', categoryId: target.id })
  await manager.load()
  assert.equal(manager.selectedMuscleExerciseCount.value, 0)
  assert.deepEqual(manager.selectedMuscleExercises.value, [])
  assert.equal(manager.selectedItem.value.id, source.id)
  assert.equal(manager.page.value, 'details')
  manager.select(target)
  assert.equal(manager.selectedMuscleExerciseCount.value, 1)
  assert.equal(manager.selectedMuscleExercises.value[0].name, 'Moved exercise')

  function closeServer() { return server.close() }
  function closeDatabase() { database.close() }
}
