import { tokenizeTrainingQuestion } from './tokenizeTrainingQuestion.js'

const UNKNOWN_INTENT = 'unknown'
const MINIMUM_KNOWN_TOKEN_RATIO = 0.5

export function trainIntentClassifier(examples) {
  const intents = new Map()
  const vocabulary = new Set()
  let documentCount = 0

  for (const example of examples ?? []) {
    const exampleAdded = addTrainingExample(intents, vocabulary, example)
    if (exampleAdded) documentCount += 1
  }

  return {
    intents,
    vocabulary,
    documentCount,
  }
}

export function classifyTrainingIntent(model, question) {
  const tokens = tokenizeTrainingQuestion(question)
  if (!tokens.length || !model?.documentCount) return UNKNOWN_INTENT

  const knownTokenCount = countKnownTokens(model.vocabulary, tokens)
  if (!hasEnoughKnownTokens(knownTokenCount, tokens.length)) return UNKNOWN_INTENT

  let bestIntent = UNKNOWN_INTENT
  let bestScore = Number.NEGATIVE_INFINITY

  for (const [intent, statistics] of model.intents) {
    const score = calculateIntentScore(model, statistics, tokens)
    if (score <= bestScore) continue
    bestIntent = intent
    bestScore = score
  }

  return bestIntent
}

function addTrainingExample(intents, vocabulary, example) {
  const intent = String(example?.intent ?? '').trim()
  const tokens = tokenizeTrainingQuestion(example?.text)
  if (!intent || !tokens.length) return false

  const statistics = intents.get(intent) ?? createIntentStatistics()
  statistics.documentCount += 1

  for (const token of tokens) {
    const tokenCount = statistics.tokens.get(token) ?? 0
    statistics.tokens.set(token, tokenCount + 1)
    statistics.tokenCount += 1
    vocabulary.add(token)
  }

  intents.set(intent, statistics)
  return true
}

function countKnownTokens(vocabulary, tokens) {
  let count = 0

  for (const token of tokens) {
    if (vocabulary.has(token)) count += 1
  }

  return count
}

function hasEnoughKnownTokens(knownTokenCount, tokenCount) {
  if (!knownTokenCount || !tokenCount) return false
  return knownTokenCount / tokenCount > MINIMUM_KNOWN_TOKEN_RATIO
}

function createIntentStatistics() {
  return {
    documentCount: 0,
    tokenCount: 0,
    tokens: new Map(),
  }
}

function calculateIntentScore(model, statistics, tokens) {
  const intentProbability = statistics.documentCount / model.documentCount
  const possibleTokenCount = statistics.tokenCount + model.vocabulary.size
  let score = Math.log(intentProbability)

  for (const token of tokens) {
    const tokenCount = statistics.tokens.get(token) ?? 0
    score += Math.log((tokenCount + 1) / possibleTokenCount)
  }

  return score
}
