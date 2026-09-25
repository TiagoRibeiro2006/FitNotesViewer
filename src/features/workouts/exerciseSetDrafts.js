import { createLocalId } from '../../shared/utils/ids.js'
import {
  displayWeight,
  KILOGRAMS,
  storeWeight,
} from '../../shared/units/weightUnits.js'

const DISPLAY_DECIMALS = 3

export function createEmptySetDrafts(count = 3) {
  const drafts = []

  for (let index = 0; index < count; index += 1) {
    drafts.push(createSetDraft('', '', null, true))
  }

  return drafts
}

export function createSetDrafts(sets, displayUnit = KILOGRAMS) {
  const drafts = []

  for (const set of sets) {
    const storedWeight = readStoredWeight(set.weight)
    const shownWeight = storedWeight === null
      ? ''
      : formatDraftWeight(displayWeight(storedWeight, displayUnit))
    drafts.push(createSetDraft(shownWeight, set.reps ?? '', storedWeight, false))
  }

  return drafts
}

export function createNextSetDraft(drafts, previousSets) {
  const index = drafts.length
  const previous = previousSets[index]
  const last = drafts[index - 1]

  const source = previous ?? last
  if (!source) return createSetDraft('', '', null, true)

  return createSetDraft(
    source.weight ?? '',
    source.reps ?? '',
    source.storedWeight ?? null,
    Boolean(source.weightEdited),
  )
}

export function createStoredSetDrafts(drafts, displayUnit = KILOGRAMS) {
  const storedDrafts = []

  for (const draft of drafts) {
    storedDrafts.push({
      draftId: draft.draftId,
      weight: resolveStoredWeight(draft, displayUnit),
      reps: draft.reps,
    })
  }

  return storedDrafts
}

export function updateSetDraftWeight(draft, value) {
  draft.weight = value
  draft.storedWeight = null
  draft.weightEdited = true
}

export function clearSetDraft(draft) {
  updateSetDraftWeight(draft, '')
  draft.reps = ''
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

function createSetDraft(weight, reps, storedWeight, weightEdited) {
  return {
    draftId: createLocalId('set'),
    weight,
    reps,
    storedWeight,
    weightEdited,
  }
}

function resolveStoredWeight(draft, displayUnit) {
  if (!draft.weightEdited && draft.storedWeight !== null) {
    return draft.storedWeight
  }
  return storeWeight(draft.weight, displayUnit)
}

function readStoredWeight(value) {
  if (value === '' || value === null || value === undefined) return null
  const weight = Number(value)
  return Number.isFinite(weight) ? weight : null
}

function formatDraftWeight(value) {
  if (!Number.isFinite(value)) return ''
  const scale = 10 ** DISPLAY_DECIMALS
  return String(Math.round(value * scale) / scale)
}
