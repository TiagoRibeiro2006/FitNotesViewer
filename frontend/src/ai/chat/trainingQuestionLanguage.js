import { splitTrainingWords } from './trainingText.js'

const PORTUGUESE_WORDS = new Set([
  'ajudar',
  'analisar',
  'antebraco',
  'boa',
  'bom',
  'como',
  'costas',
  'deltoide',
  'esta',
  'estou',
  'evolucao',
  'exercicio',
  'exercicios',
  'frequencia',
  'fiz',
  'foi',
  'gemeos',
  'gluteo',
  'historico',
  'intervalo',
  'mais',
  'menos',
  'meu',
  'musculo',
  'musculos',
  'media',
  'melhor',
  'melhorar',
  'ola',
  'ombro',
  'panturrilha',
  'peito',
  'peitoral',
  'perguntar',
  'periodo',
  'peso',
  'posso',
  'qual',
  'quantas',
  'quantos',
  'resumo',
  'repeticao',
  'repeticoes',
  'progresso',
  'quadriceps',
  'sugestao',
  'series',
  'treinei',
  'treino',
  'treinos',
  'treinado',
  'treinada',
  'trapezio',
  'ultimo',
  'vezes',
])

export function detectTrainingQuestionLanguage(question) {
  const words = splitTrainingWords(question)

  for (const word of words) {
    if (PORTUGUESE_WORDS.has(word)) return 'pt'
  }

  return 'en'
}
