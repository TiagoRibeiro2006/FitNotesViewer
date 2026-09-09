import { normalizeTrainingText, splitTrainingWords } from './trainingText.js'

const INTENT_PHRASE_HINTS = [
  hint('date-range', ['date range', 'training period', 'intervalo analisado', 'periodo analisado']),
  hint('best-set', ['best set', 'heaviest set', 'maximum weight', 'melhor set', 'mais peso', 'peso maximo']),
]

const FALLBACK_PHRASE_HINTS = [
  hint('total-sets', ['set count', 'total sets', 'quantos sets', 'total de series']),
]

const INTENT_HINTS = [
  hint('total-reps', ['reps', 'repeticao', 'repeticoes']),
  hint('average-sets', ['average', 'media']),
  hint('frequency', ['frequency', 'frequencia']),
  hint('volume', ['volume']),
  hint('progress', ['progress', 'progression', 'progresso', 'progredir', 'evolucao']),
]

export function refineTrainingIntent(question, classifiedIntent) {
  const normalizedQuestion = normalizeTrainingText(question)
  const phraseIntent = findPhraseIntent(normalizedQuestion)
  if (phraseIntent) return phraseIntent

  const words = new Set(splitTrainingWords(question))

  for (const definition of INTENT_HINTS) {
    if (containsHint(words, definition.words)) return definition.intent
  }

  const fallbackIntent = findPhraseIntent(normalizedQuestion, FALLBACK_PHRASE_HINTS)
  if (fallbackIntent) return fallbackIntent

  return classifiedIntent
}

function findPhraseIntent(question, definitions = INTENT_PHRASE_HINTS) {
  for (const definition of definitions) {
    for (const phrase of definition.words) {
      if (question.includes(phrase)) return definition.intent
    }
  }
  return null
}

function containsHint(questionWords, hints) {
  for (const word of hints) {
    if (questionWords.has(word)) return true
  }
  return false
}

function hint(intent, words) {
  return { intent, words }
}
