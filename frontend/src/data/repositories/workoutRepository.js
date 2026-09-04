import { createLocalId } from '../../shared/utils/ids'
import { normalizeNonNegativeNumber, normalizePositiveInteger } from '../../shared/utils/validation'
import { buildHistoricalProgress, buildProgressBaseline } from '../../shared/utils/exerciseProgress'
import { openAppDatabase } from '../indexedDb/database'
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

function buildWorkoutCalendarColors(workoutSets = [], exercises = [], categories = []) {
  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const setsByDate = new Map()

  for (const set of workoutSets) {
    if (!set.date) continue
    const daySets = setsByDate.get(set.date) ?? []
    daySets.push(set)
    setsByDate.set(set.date, daySets)
  }

  return new Map([...setsByDate].map(([date, daySets]) => {
    const firstSet = orderWorkoutDayRows(daySets)[0]
    const exercise = exercisesById.get(firstSet?.exerciseId)
    const category = categoriesById.get(exercise?.categoryId)
    return [date, category?.colour ?? null]
  }))
}

function buildWorkoutHistory(rows) {
  const rowsByDate = new Map()
  const progressById = buildHistoricalProgress(rows)

  for (const row of rows) {
    if (!row.date) continue
    const dayRows = rowsByDate.get(row.date) ?? []
    dayRows.push(row)
    rowsByDate.set(row.date, dayRows)
  }

  return [...rowsByDate]
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, dayRows]) => ({
      date,
      sets: dayRows.sort(compareSetRows).map((row) => ({
         id: row.id,
         isProgress: progressById.get(row.id) ?? false,
         reps: row.reps,
        weight: row.weight,
      })),
    }))
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

function compareSetRows(a, b) {
  const orderA = Number.isFinite(Number(a.localSetOrder)) ? Number(a.localSetOrder) : Number.MAX_SAFE_INTEGER
  const orderB = Number.isFinite(Number(b.localSetOrder)) ? Number(b.localSetOrder) : Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB

  const idA = typeof a.id === 'number' ? a.id : Number.MAX_SAFE_INTEGER
  const idB = typeof b.id === 'number' ? b.id : Number.MAX_SAFE_INTEGER
  if (idA !== idB) return idA - idB
  return String(a.id).localeCompare(String(b.id))
}

function orderWorkoutDayRows(rows) {
  const groups = new Map()

  for (const row of [...rows].sort(compareSourceRows)) {
    const group = groups.get(row.exerciseId) ?? { rows: [], sourceOrder: groups.size, savedOrder: null }
    group.rows.push(row)

    const savedOrder = Number(row.dayExerciseOrder)
    if (row.dayExerciseOrder !== null && row.dayExerciseOrder !== undefined && Number.isInteger(savedOrder) && savedOrder >= 0) {
      group.savedOrder = savedOrder
    }
    groups.set(row.exerciseId, group)
  }

  return [...groups.values()]
    .sort((a, b) => (a.savedOrder ?? a.sourceOrder) - (b.savedOrder ?? b.sourceOrder) || a.sourceOrder - b.sourceOrder)
    .flatMap((group) => group.rows.sort(compareSetRows))
}

function compareSourceRows(a, b) {
  const idA = typeof a.id === 'number' ? a.id : Number.MAX_SAFE_INTEGER
  const idB = typeof b.id === 'number' ? b.id : Number.MAX_SAFE_INTEGER
  if (idA !== idB) return idA - idB

  const updatedAtComparison = String(a.localUpdatedAt ?? '').localeCompare(String(b.localUpdatedAt ?? ''))
  if (updatedAtComparison !== 0) return updatedAtComparison
  return String(a.id).localeCompare(String(b.id))
}

function selectProgressRows(rows, date) {
  const progressById = buildHistoricalProgress(rows)
  const selectedRows = []

  for (const row of rows) {
    if (row.date !== date) continue
    selectedRows.push({ ...row, isProgress: progressById.get(row.id) === true })
  }

  return selectedRows
}
