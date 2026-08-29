const FIRST_REP_MAX = 1
const LAST_REP_MAX = 20

export function calculateRepMaxTable(weightValue, repsValue) {
  const weightText = String(weightValue).trim()
  const repsText = String(repsValue).trim()
  const weight = weightText ? Number(weightText.replace(',', '.')) : Number.NaN
  const reps = repsText ? Number(repsText) : Number.NaN
  const table = []

  for (let targetReps = FIRST_REP_MAX; targetReps <= LAST_REP_MAX; targetReps += 1) {
    table.push({
      targetReps,
      weight: calculateTargetWeight(weight, reps, targetReps),
    })
  }

  return table
}

function calculateTargetWeight(weight, reps, targetReps) {
  if (!Number.isFinite(weight) || weight < 0) return null
  if (!Number.isInteger(reps) || reps < 1 || reps > 100) return null

  const oneRepMax = weight * (1 + reps / 30)
  return oneRepMax / (1 + targetReps / 30)
}
