import { normalizeTrainingText } from './trainingText.js'

const MUSCLE_ALIASES = [
  alias(['abdominal', 'abdominais'], ['abs']),
  alias(['adutor', 'adutores'], ['adductors']),
  alias(['antebraco', 'antebracos'], ['forearm']),
  alias(['costas', 'dorsal', 'dorsais'], ['lats']),
  alias(['deltoide anterior', 'ombro frontal'], ['front delts']),
  alias(['deltoide lateral', 'ombro lateral'], ['side delts']),
  alias(['deltoide posterior', 'ombro posterior'], ['rear delts']),
  alias(['gemeos', 'panturrilha', 'panturrilhas'], ['calfs', 'calves']),
  alias(['gluteo', 'gluteos'], ['glutes']),
  alias(['peito', 'peitoral', 'peitorais'], ['chest']),
  alias(['posterior da coxa', 'posteriores da coxa', 'isquiotibiais'], ['hamstrings']),
  alias(['quadriceps'], ['quads']),
  alias(['trapezio', 'trapezios'], ['traps']),
]

export function findTrainingEntity(question, statistics) {
  const normalizedQuestion = normalizePhrase(question)
  if (!normalizedQuestion) return null

  const exercise = findNamedGroup(normalizedQuestion, statistics?.exercises)
  if (exercise) return { type: 'exercise', group: exercise }

  const muscle = findNamedGroup(normalizedQuestion, statistics?.muscles)
  if (muscle) return { type: 'muscle', group: muscle }

  const aliasedMuscle = findAliasedMuscle(normalizedQuestion, statistics?.muscles)
  if (aliasedMuscle) return { type: 'muscle', group: aliasedMuscle }
  return null
}

function findNamedGroup(question, groups) {
  const candidates = [...(groups ?? [])]
  candidates.sort(compareNameLength)

  for (const group of candidates) {
    const name = normalizePhrase(group?.name)
    if (name && containsPhrase(question, name)) return group
  }

  return null
}

function findAliasedMuscle(question, muscles) {
  for (const definition of MUSCLE_ALIASES) {
    if (!containsAnyPhrase(question, definition.aliases)) continue

    for (const muscle of muscles ?? []) {
      const muscleName = normalizePhrase(muscle?.name)
      if (definition.names.includes(muscleName)) return muscle
    }
  }

  return null
}

function containsAnyPhrase(text, phrases) {
  for (const phrase of phrases) {
    if (containsPhrase(text, phrase)) return true
  }
  return false
}

function containsPhrase(text, phrase) {
  return (' ' + text + ' ').includes(' ' + phrase + ' ')
}

function normalizePhrase(value) {
  return normalizeTrainingText(value).replace(/[^a-z0-9]+/g, ' ').trim()
}

function compareNameLength(first, second) {
  return String(second?.name ?? '').length - String(first?.name ?? '').length
}

function alias(aliases, names) {
  return { aliases, names }
}
