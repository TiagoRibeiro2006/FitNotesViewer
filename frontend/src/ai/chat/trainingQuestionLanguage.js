const PORTUGUESE_WORDS = new Set([
  'ajudar',
  'boa',
  'bom',
  'como',
  'esta',
  'exercicio',
  'exercicios',
  'fiz',
  'mais',
  'meu',
  'musculo',
  'musculos',
  'ola',
  'perguntar',
  'posso',
  'qual',
  'quantas',
  'quantos',
  'resumo',
  'series',
  'treinei',
  'treino',
  'treinos',
  'vezes',
])

export function detectTrainingQuestionLanguage(question) {
  const words = splitWords(question)

  for (const word of words) {
    if (PORTUGUESE_WORDS.has(word)) return 'pt'
  }

  return 'en'
}

function splitWords(text) {
  return normalizeText(text).split(/[^a-z0-9]+/).filter(Boolean)
}

function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
