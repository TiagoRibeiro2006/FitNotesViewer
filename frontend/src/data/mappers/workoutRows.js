import { buildHistoricalProgress } from '../../shared/utils/exerciseProgress.js'

export function buildWorkoutCalendarColors(workoutSets = [], exercises = [], categories = []) {
  const exercisesById = buildLookup(exercises)
  const categoriesById = buildLookup(categories)
  const setsByDate = groupRowsByDate(workoutSets)
  const colorsByDate = new Map()

  for (const [date, daySets] of setsByDate) {
    const firstSet = orderWorkoutDayRows(daySets)[0]
    const exercise = exercisesById.get(firstSet?.exerciseId)
    const category = categoriesById.get(exercise?.categoryId)
    colorsByDate.set(date, category?.colour ?? null)
  }

  return colorsByDate
}

export function buildWorkoutHistory(rows) {
  const rowsByDate = groupRowsByDate(rows)
  const progressById = buildHistoricalProgress(rows)
  const history = []

  for (const [date, dayRows] of rowsByDate) {
    history.push({
      date,
      sets: buildHistorySets(dayRows, progressById),
    })
  }

  history.sort(compareHistoryDates)
  return history
}

export function compareSetRows(first, second) {
  const orderA = readSetOrder(first)
  const orderB = readSetOrder(second)
  if (orderA !== orderB) return orderA - orderB

  const idA = readNumericId(first)
  const idB = readNumericId(second)
  if (idA !== idB) return idA - idB
  return String(first.id).localeCompare(String(second.id))
}

export function orderWorkoutDayRows(rows) {
  const sortedRows = [...rows]
  sortedRows.sort(compareSourceRows)
  const groups = groupRowsByExercise(sortedRows)
  const orderedGroups = [...groups.values()]
  orderedGroups.sort(compareExerciseGroups)

  const orderedRows = []
  for (const group of orderedGroups) {
    group.rows.sort(compareSetRows)
    orderedRows.push(...group.rows)
  }

  return orderedRows
}

export function selectProgressRows(rows, date) {
  const progressById = buildHistoricalProgress(rows)
  const selectedRows = []

  for (const row of rows) {
    if (row.date !== date) continue
    selectedRows.push({ ...row, isProgress: progressById.get(row.id) === true })
  }

  return selectedRows
}

function buildLookup(rows) {
  const rowsById = new Map()
  for (const row of rows) rowsById.set(row.id, row)
  return rowsById
}

function groupRowsByDate(rows) {
  const rowsByDate = new Map()

  for (const row of rows) {
    if (!row.date) continue
    const dayRows = rowsByDate.get(row.date) ?? []
    dayRows.push(row)
    rowsByDate.set(row.date, dayRows)
  }

  return rowsByDate
}

function buildHistorySets(rows, progressById) {
  const orderedRows = [...rows]
  orderedRows.sort(compareSetRows)
  const sets = []

  for (const row of orderedRows) {
    sets.push({
      id: row.id,
      isProgress: progressById.get(row.id) ?? false,
      reps: row.reps,
      weight: row.weight,
    })
  }

  return sets
}

function compareHistoryDates(first, second) {
  return second.date.localeCompare(first.date)
}

function readSetOrder(row) {
  const order = Number(row.localSetOrder)
  return Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER
}

function readNumericId(row) {
  return typeof row.id === 'number' ? row.id : Number.MAX_SAFE_INTEGER
}

function groupRowsByExercise(rows) {
  const groups = new Map()

  for (const row of rows) {
    const group = groups.get(row.exerciseId) ?? createExerciseGroup(groups.size)
    group.rows.push(row)
    updateSavedOrder(group, row.dayExerciseOrder)
    groups.set(row.exerciseId, group)
  }

  return groups
}

function createExerciseGroup(sourceOrder) {
  return {
    rows: [],
    sourceOrder,
    savedOrder: null,
  }
}

function updateSavedOrder(group, savedOrder) {
  const order = Number(savedOrder)
  if (savedOrder === null || savedOrder === undefined) return
  if (!Number.isInteger(order) || order < 0) return
  group.savedOrder = order
}

function compareExerciseGroups(first, second) {
  const firstOrder = first.savedOrder ?? first.sourceOrder
  const secondOrder = second.savedOrder ?? second.sourceOrder
  return firstOrder - secondOrder || first.sourceOrder - second.sourceOrder
}

function compareSourceRows(first, second) {
  const idA = readNumericId(first)
  const idB = readNumericId(second)
  if (idA !== idB) return idA - idB

  const updatedAtComparison = String(first.localUpdatedAt ?? '')
    .localeCompare(String(second.localUpdatedAt ?? ''))
  if (updatedAtComparison !== 0) return updatedAtComparison
  return String(first.id).localeCompare(String(second.id))
}
