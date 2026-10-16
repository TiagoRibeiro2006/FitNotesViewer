import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import 'fake-indexeddb/auto'
import { resolveMuscleIcon } from '../src/shared/models/muscleIcons.js'

test('defaults Abs to its icon and respects an explicit empty selection', verifyDefaults)

function verifyDefaults() {
  assert.equal(resolveMuscleIcon('Abs'), 'abs')
  assert.equal(resolveMuscleIcon('Abs', ''), '')
  assert.equal(resolveMuscleIcon('Chest', 'abs'), 'abs')
  assert.equal(resolveMuscleIcon('Chest'), '')
}

test('persists icon selection and exposes it on associated exercises', verifyPersistence)

async function verifyPersistence(t) {
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
  const muscle = await repository.createCategoryDetails({ name: 'Test muscle', colour: -65536, iconId: 'abs' })
  const result = await repository.createExerciseDetails({ name: 'Test exercise', categoryId: muscle.id })
  let catalog = await repository.getExerciseCatalog()
  assert.equal(findExercise(catalog).categoryIcon, 'abs')
  await repository.updateCategoryDetails(muscle.id, { name: 'Abs', colour: -65536, iconId: '' })
  catalog = await repository.getExerciseCatalog()
  assert.equal(findExercise(catalog).categoryIcon, '')
  assert.equal(catalog.categories.find(isMuscle).iconId, '')

  function findExercise(catalog) {
    return catalog.exercises.find(isExercise)
  }
  function isExercise(exercise) {
    return exercise.id === result.exercise.id
  }
  function isMuscle(category) {
    return category.id === muscle.id
  }
  function closeServer() {
    return server.close()
  }
  function closeDatabase() {
    database.close()
  }
}
