export function buildHistoricalProgress(rows) {
  const orderedRows = [...rows]
  orderedRows.sort(compareChronologicalRows)
  const states = new Map()
  const progressById = new Map()

  for (const row of orderedRows) {
    const state = states.get(row.exerciseId) ?? createEmptyProgressState()
    const progress = updateProgressState(state, row)
    progressById.set(row.id, progress)
    states.set(row.exerciseId, state)
  }

  return progressById
}

export function buildProgressBaseline(rows) {
  const orderedRows = [...rows]
  orderedRows.sort(compareChronologicalRows)
  const state = createEmptyProgressState()
  for (const row of orderedRows) updateProgressState(state, row)
  return state
}

export function calculateDraftProgress(drafts, baseline) {
  const state = copyProgressState(baseline)
  const progress = []

  for (const draft of drafts) progress.push(updateProgressState(state, draft))
  return progress
}

function updateProgressState(state, set) {
  const point = readProgressPoint(set)
  if (!point || isDominated(point, state.points)) return false

  const remainingPoints = []
  for (const existingPoint of state.points) {
    if (!dominates(point, existingPoint)) remainingPoints.push(existingPoint)
  }
  remainingPoints.push(point)
  state.points = remainingPoints
  return true
}

function createEmptyProgressState() {
  return { points: [] }
}

function copyProgressState(source) {
  const state = createEmptyProgressState()
  for (const point of source?.points ?? []) {
    const validPoint = readProgressPoint(point)
    if (validPoint) state.points.push(validPoint)
  }
  return state
}

function readProgressPoint(set) {
  const weight = Number(String(set.weight).replace(',', '.'))
  const reps = Number(set.reps)
  if (!Number.isFinite(weight) || weight < 0) return null
  if (!Number.isInteger(reps) || reps < 1) return null
  return { weight, reps }
}

function isDominated(point, existingPoints) {
  for (const existingPoint of existingPoints) {
    if (dominates(existingPoint, point)) return true
  }
  return false
}

function dominates(first, second) {
  return first.weight >= second.weight && first.reps >= second.reps
}

function compareChronologicalRows(first, second) {
  const dateComparison = String(first.date ?? '').localeCompare(String(second.date ?? ''))
  if (dateComparison !== 0) return dateComparison

  const firstOrder = readSetOrder(first)
  const secondOrder = readSetOrder(second)
  if (firstOrder !== secondOrder) return firstOrder - secondOrder
  return String(first.id ?? '').localeCompare(String(second.id ?? ''))
}

function readSetOrder(set) {
  const localOrder = Number(set.localSetOrder)
  if (Number.isInteger(localOrder) && localOrder >= 0) return localOrder
  const id = Number(set.id)
  return Number.isFinite(id) ? id : Number.MAX_SAFE_INTEGER
}
