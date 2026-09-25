import { createLocalId } from '../../shared/utils/ids'
import { normalizeNonNegativeNumber, normalizePositiveInteger } from '../../shared/utils/validation'
import { buildProgressBaseline } from '../../shared/utils/exerciseProgress'
import { openAppDatabase } from '../indexedDb/database'
import {
  buildWorkoutCalendarColors,
  buildWorkoutHistory,
  compareSetRows,
  orderWorkoutDayRows,
  selectProgressRows,
} from '../mappers/workoutRows'
import { markLocalChanges, requestResult, transactionComplete } from '../indexedDb/transactions'
import { getSummary, refreshSummary } from './summaryRepository'
import { createWorkoutDayCopies } from './workoutCopy'

export async function getWorkoutCalendarColors() {
  const database = await openAppDatabase()
  const transaction = database.transaction(['workoutSets', 'exercises', 'categories'], 'readonly')
  const done = transactionComplete(transaction)
  const [workoutSets, exercises, categories] = await Promise.all([
    requestResult(transaction.objectStore('workoutSets').getAll()),
    requestResult(transaction.objectStore('exercises').getAll()),
    requestResult(transaction.objectStore('categories').getAll()),
  ])
  await done
  return buildWorkoutCalendarColors(workoutSets, exercises, categories)
}

export async function getWorkoutSetsForDate(date) {
  const database = await openAppDatabase()
  const transaction = database.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const allRows = await requestResult(transaction.objectStore('workoutSets').getAll())
  await done
  return orderWorkoutDayRows(selectProgressRows(allRows ?? [], date))
}

export async function getWorkoutSetsForDateExercise(date, exerciseId) {
  const database = await openAppDatabase()
  const transaction = database.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const rows = await requestResult(transaction.objectStore('workoutSets').index('exerciseId').getAll(exerciseId))
  await done
  return selectProgressRows(rows ?? [], date).sort(compareSetRows)
}

export async function getWorkoutProgressBaseline(exerciseId, beforeDate) {
  const database = await openAppDatabase()
  const transaction = database.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const rows = await requestResult(transaction.objectStore('workoutSets').index('exerciseId').getAll(exerciseId))
  await done

  const previousRows = []
  for (const row of rows ?? []) {
    if (row.date && row.date < beforeDate) previousRows.push(row)
  }
  return buildProgressBaseline(previousRows)
}

export async function getPreviousWorkoutSetsForExercise(exerciseId, beforeDate) {
  const database = await openAppDatabase()
  const transaction = database.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const rows = await requestResult(transaction.objectStore('workoutSets').index('exerciseId').getAll(exerciseId))
  await done

  const previousRows = (rows ?? []).filter((row) => row.date && row.date < beforeDate)
  if (!previousRows.length) return { date: null, sets: [] }

  const previousDate = previousRows.reduce((latest, row) => row.date > latest ? row.date : latest, previousRows[0].date)
  return {
    date: previousDate,
    sets: previousRows.filter((row) => row.date === previousDate).sort(compareSetRows),
  }
}

export async function getWorkoutHistoryForExercise(exerciseId) {
  const database = await openAppDatabase()
  const transaction = database.transaction('workoutSets', 'readonly')
  const done = transactionComplete(transaction)
  const rows = await requestResult(transaction.objectStore('workoutSets').index('exerciseId').getAll(exerciseId))
  await done
  return buildWorkoutHistory(rows ?? [])
}

export async function saveWorkoutExercise(date, exercise, sets) {
  const cleanedSets = sets
    .map((set) => ({
      weight: normalizeNonNegativeNumber(set.weight),
      reps: normalizePositiveInteger(set.reps),
    }))
    .filter((set) => set.weight !== null && set.reps !== null)

  if (!cleanedSets.length) throw new Error('Add at least one complete set before saving.')

  const database = await openAppDatabase()
  const lookupTransaction = database.transaction('workoutSets', 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const dayRows = await requestResult(lookupTransaction.objectStore('workoutSets').index('date').getAll(date))
  await lookupDone

  const exerciseIds = [...new Set(orderWorkoutDayRows(dayRows ?? []).map((row) => row.exerciseId))]
  const existingOrder = exerciseIds.indexOf(exercise.id)
  const exerciseOrder = existingOrder >= 0 ? existingOrder : exerciseIds.length
  const exerciseOrders = new Map(exerciseIds.map((exerciseId, index) => [exerciseId, index]))
  const transaction = database.transaction(['workoutSets', 'metadata'], 'readwrite')
  const store = transaction.objectStore('workoutSets')
  const updatedAt = new Date().toISOString()

  for (const row of dayRows ?? []) {
    if (row.exerciseId === exercise.id) {
      store.delete(row.id)
    } else {
      const dayExerciseOrder = exerciseOrders.get(row.exerciseId)
      if (row.dayExerciseOrder !== dayExerciseOrder) store.put({ ...row, dayExerciseOrder })
    }
  }

  cleanedSets.forEach((set, index) => {
    store.put(createWorkoutSet(date, exercise, set, exerciseOrder, index, updatedAt))
  })

  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)
  return refreshSummary()
}

export async function deleteWorkoutExercise(date, exerciseId) {
  const database = await openAppDatabase()
  const lookupTransaction = database.transaction('workoutSets', 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const keys = await requestResult(lookupTransaction.objectStore('workoutSets').index('dateExercise').getAllKeys([date, exerciseId]))
  await lookupDone

  if (!keys?.length) return getSummary()

  const transaction = database.transaction(['workoutSets', 'metadata'], 'readwrite')
  const store = transaction.objectStore('workoutSets')
  for (const key of keys) store.delete(key)
  markLocalChanges(transaction)
  await transactionComplete(transaction)
  return refreshSummary()
}

export async function reorderWorkoutExercises(date, exerciseIds) {
  const database = await openAppDatabase()
  const lookupTransaction = database.transaction('workoutSets', 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const rows = await requestResult(lookupTransaction.objectStore('workoutSets').index('date').getAll(date))
  await lookupDone

  const orderByExercise = new Map(exerciseIds.map((exerciseId, index) => [exerciseId, index]))
  const changedRows = (rows ?? []).filter((row) => {
    const order = orderByExercise.get(row.exerciseId)
    return order !== undefined && row.dayExerciseOrder !== order
  })
  if (!changedRows.length) return

  const updatedAt = new Date().toISOString()
  const transaction = database.transaction(['workoutSets', 'metadata'], 'readwrite')
  const store = transaction.objectStore('workoutSets')

  for (const row of changedRows) {
    store.put({
      ...row,
      dayExerciseOrder: orderByExercise.get(row.exerciseId),
      localUpdatedAt: updatedAt,
    })
  }

  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)
}

export async function copyWorkoutDay(sourceDate, targetDate) {
  if (sourceDate === targetDate) return getSummary()

  const database = await openAppDatabase()
  const lookupTransaction = database.transaction('workoutSets', 'readonly')
  const lookupDone = transactionComplete(lookupTransaction)
  const store = lookupTransaction.objectStore('workoutSets')
  const [sourceRows, targetKeys] = await Promise.all([
    requestResult(store.index('date').getAll(sourceDate)),
    requestResult(store.index('date').getAllKeys(targetDate)),
  ])
  await lookupDone

  if (!sourceRows?.length && !targetKeys?.length) return getSummary()

  const transaction = database.transaction(['workoutSets', 'metadata'], 'readwrite')
  const targetStore = transaction.objectStore('workoutSets')
  const updatedAt = new Date().toISOString()
  const copiedRows = createWorkoutDayCopies(
    orderWorkoutDayRows(sourceRows ?? []),
    targetDate,
    updatedAt,
    createCopyId,
  )

  for (const key of targetKeys ?? []) targetStore.delete(key)
  for (const row of copiedRows) targetStore.put(row)

  markLocalChanges(transaction, updatedAt)
  await transactionComplete(transaction)
  return refreshSummary()
}

function createCopyId() {
  return createLocalId('local')
}

function createWorkoutSet(date, exercise, set, exerciseOrder, setOrder, updatedAt) {
  return {
    id: createLocalId('local'),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    date,
    weight: set.weight,
    reps: set.reps,
    unit: 0,
    routineSectionExerciseSetId: 0,
    timerAutoStart: 0,
    isPersonalRecord: 0,
    isPersonalRecordFirst: 0,
    isComplete: 1,
    distance: 0,
    durationSeconds: 0,
    dayExerciseOrder: exerciseOrder,
    localSetOrder: setOrder,
    createdLocally: true,
    localUpdatedAt: updatedAt,
  }
}
