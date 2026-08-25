export function createEmptySetDrafts(count = 3) {
  const drafts = []

  for (let index = 0; index < count; index += 1) {
    drafts.push({ weight: '', reps: '' })
  }

  return drafts
}

export function createSetDrafts(sets) {
  const drafts = []

  for (const set of sets) {
    drafts.push({
      weight: set.weight ?? '',
      reps: set.reps ?? '',
    })
  }

  return drafts
}

export function createNextSetDraft(drafts, previousSets) {
  const index = drafts.length
  const previous = previousSets[index]
  const last = drafts[index - 1]

  return {
    weight: previous?.weight ?? last?.weight ?? '',
    reps: previous?.reps ?? last?.reps ?? '',
  }
}

export function validateSetDrafts(drafts) {
  let completeSets = 0

  for (const draft of drafts) {
    const weightBlank = isBlank(draft.weight)
    const repsBlank = isBlank(draft.reps)

    if (weightBlank && repsBlank) continue
    if (weightBlank || repsBlank) return false

    const weight = Number(String(draft.weight).replace(',', '.'))
    const reps = Number(draft.reps)
    if (!Number.isFinite(weight) || weight < 0) return false
    if (!Number.isInteger(reps) || reps <= 0) return false
    completeSets += 1
  }

  return completeSets > 0
}

function isBlank(value) {
  return value === '' || value === null || value === undefined
}
