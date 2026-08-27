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
  const state = {
    bestReps: Number(baseline?.bestReps ?? 0),
    maxWeight: baseline?.maxWeight ?? null,
  }
  const progress = []

  for (const draft of drafts) progress.push(updateProgressState(state, draft))
  return progress
}

function updateProgressState(state, set) {
  const weight = Number(String(set.weight).replace(',', '.'))
  const reps = Number(set.reps)
  if (!Number.isFinite(weight) || weight < 0) return false
  if (!Number.isInteger(reps) || reps < 1) return false

  const progressed =
    state.maxWeight === null ||
    weight > state.maxWeight ||
    (weight === state.maxWeight && reps > state.bestReps)

  if (weight > (state.maxWeight ?? Number.NEGATIVE_INFINITY)) {
    state.maxWeight = weight
    state.bestReps = reps
  } else if (weight === state.maxWeight && reps > state.bestReps) {
    state.bestReps = reps
  }

  return progressed
}

function createEmptyProgressState() {
  return { bestReps: 0, maxWeight: null }
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
