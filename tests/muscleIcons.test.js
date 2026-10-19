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
  assert.equal(resolveMuscleIcon('Chest'), 'chest')
  assert.equal(resolveMuscleIcon('Side Delts'), 'side-delts')
  assert.equal(resolveMuscleIcon('Adductors'), 'adductors')
  assert.equal(resolveMuscleIcon('Glutes'), 'glutes')
  assert.equal(resolveMuscleIcon('Biceps'), 'biceps')
  assert.equal(resolveMuscleIcon('Quads'), 'quads')
  assert.equal(resolveMuscleIcon('Traps'), 'traps')
  assert.equal(resolveMuscleIcon('Hamstrings'), 'hamstrings')
  assert.equal(resolveMuscleIcon('Calfs'), 'calfs')
  assert.equal(resolveMuscleIcon('Forearm'), 'forearm')
  assert.equal(resolveMuscleIcon('Front Delts'), 'front-delts')
  assert.equal(resolveMuscleIcon('Rear Delts'), 'rear-delts')
  assert.equal(resolveMuscleIcon('Unknown'), '')
  assert.equal(resolveMuscleIcon('Lats'), 'lats')
  assert.equal(resolveMuscleIcon('Lats', ''), '')
  assert.equal(resolveMuscleIcon('Chest', 'lats'), 'lats')
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
