import { splitTrainingWords } from './trainingText.js'

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
  const words = splitTrainingWords(question)

  for (const word of words) {
    if (PORTUGUESE_WORDS.has(word)) return 'pt'
  }

  return 'en'
}
