const IGNORED_WORDS = new Set([
  'a',
  'about',
  'as',
  'can',
  'da',
  'de',
  'did',
  'do',
  'dos',
  'e',
  'eu',
  'give',
  'how',
  'i',
  'is',
  'me',
  'meu',
  'my',
  'o',
  'of',
  'os',
  'please',
  'qual',
  'quantas',
  'quantos',
  'show',
  'tell',
  'the',
  'to',
  'what',
  'which',
  'you',
])

export function tokenizeTrainingQuestion(text) {
  const normalizedText = normalizeText(text)
  const words = normalizedText.split(/[^a-z0-9]+/)
  const tokens = []

  for (const word of words) {
    if (!word || IGNORED_WORDS.has(word)) continue
    tokens.push(word)
  }

  return tokens
}

function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
