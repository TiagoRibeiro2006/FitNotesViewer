const FIRST_REP_MAX = 1
const LAST_REP_MAX = 20

export function buildExerciseRecords(days) {
  const records = []

  for (let targetReps = FIRST_REP_MAX; targetReps <= LAST_REP_MAX; targetReps += 1) {
    records.push(findRecord(days, targetReps))
  }

  return records
}

function findRecord(days, targetReps) {
  let bestRecord = null

  for (const day of days) {
    for (const set of day.sets) {
      const candidate = createCandidate(day.date, set, targetReps)
      if (candidate && isBetterRecord(candidate, bestRecord)) bestRecord = candidate
    }
  }

  return bestRecord ?? { targetReps, date: '', reps: null, weight: null }
}

function createCandidate(date, set, targetReps) {
  const reps = Number(set.reps)
  const weight = Number(set.weight)
  if (!Number.isFinite(reps) || !Number.isFinite(weight) || reps < targetReps) return null
  return { targetReps, date, reps, weight }
}

function isBetterRecord(candidate, current) {
  if (!current) return true
  if (candidate.weight !== current.weight) return candidate.weight > current.weight
  if (candidate.reps !== current.reps) return candidate.reps > current.reps
  return candidate.date > current.date
}
