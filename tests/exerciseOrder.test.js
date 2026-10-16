import assert from 'node:assert/strict'
import test from 'node:test'
import { createServer } from 'vite'
import 'fake-indexeddb/auto'

test('exercise order tracks swaps, restores its opening order and persists on save', verifyOrder)

async function verifyOrder(t) {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false },
    optimizeDeps: { noDiscovery: true, entries: [] },
    appType: 'custom',
    logLevel: 'silent',
  })
  t.after(closeServer)
  const module = await server.ssrLoadModule('/src/features/workouts/composables/useExerciseOrder.js')
  const connection = await server.ssrLoadModule('/src/data/indexedDb/database.js')
  const database = await connection.openAppDatabase()
  t.after(closeDatabase)
  const transaction = database.transaction('workoutSets', 'readwrite')
  transaction.objectStore('workoutSets').put({ id: 'order-a', exerciseId: 1, date: '2026-10-16', dayExerciseOrder: 0 })
  transaction.objectStore('workoutSets').put({ id: 'order-b', exerciseId: 2, date: '2026-10-16', dayExerciseOrder: 1 })
  const items = [{ id: 1, name: 'Press' }, { id: 2, name: 'Row' }]
  const order = module.useExerciseOrder()
  order.open(items, '2026-10-16')
  assert.equal(order.changed.value, false)
  order.move(0, -1)
  assert.equal(order.changed.value, false)
  order.move(0, 1)
  assert.deepEqual(order.exercises.value.map(readId), [2, 1])
  assert.equal(order.changed.value, true)
  assert.equal(order.originalPosition(1), 1)
  assert.equal(order.originalPosition(2), 2)
  assert.deepEqual(items.map(readId), [1, 2])
  order.reset()
  assert.equal(order.changed.value, false)
  assert.deepEqual(order.exercises.value.map(readId), [1, 2])
  order.move(1, -1)
  assert.equal(await order.save(), true)
  const workouts = await server.ssrLoadModule('/src/data/repositories/workoutRepository.js')
  const stored = await workouts.getWorkoutSetsForDate('2026-10-16')
  assert.equal(stored.find(isPress).dayExerciseOrder, 1)
  assert.equal(stored.find(isRow).dayExerciseOrder, 0)

  function closeServer() {
    return server.close()
  }

  function closeDatabase() {
    database.close()
  }
}

function readId(exercise) {
  return exercise.id
}

function isPress(set) {
  return set.exerciseId === 1
}

function isRow(set) {
  return set.exerciseId === 2
}
