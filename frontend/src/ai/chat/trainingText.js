export function normalizeTrainingText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function splitTrainingWords(text) {
  const words = normalizeTrainingText(text).split(/[^a-z0-9]+/)
  const result = []

  for (const word of words) {
    if (word) result.push(word)
  }

  return result
}
