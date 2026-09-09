import { normalizeTrainingText } from './trainingText.js'

const IGNORED_WORDS = new Set([
  'a',
  'about',
  'ao',
  'aos',
  'as',
  'can',
  'com',
  'da',
  'de',
  'did',
  'do',
  'dos',
  'e',
  'em',
  'eu',
  'for',
  'from',
  'give',
  'how',
  'i',
  'is',
  'me',
  'meu',
  'my',
  'na',
  'nas',
  'no',
  'nos',
  'num',
  'o',
  'of',
  'os',
  'please',
  'por',
  'para',
  'qual',
  'quantas',
  'quantos',
  'show',
  'tell',
  'the',
  'to',
  'um',
  'uma',
  'was',
  'were',
  'what',
  'which',
  'you',
  'your',
])

export function tokenizeTrainingQuestion(text) {
  const normalizedText = normalizeTrainingText(text)
  const words = normalizedText.split(/[^a-z0-9]+/)
  const tokens = []

  for (const word of words) {
    if (!word || IGNORED_WORDS.has(word)) continue
    tokens.push(word)
  }

  return tokens
}
