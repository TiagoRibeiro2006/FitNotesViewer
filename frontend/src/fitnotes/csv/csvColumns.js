export function createCsvColumns(headers) {
  const indexes = new Map()

  for (let index = 0; index < headers.length; index += 1) {
    indexes.set(normalizeHeader(headers[index]), index)
  }

  function find(aliases) {
    for (const alias of aliases) {
      const index = indexes.get(normalizeHeader(alias))
      if (index !== undefined) return index
    }
    return -1
  }

  function read(row, aliases) {
    const index = find(aliases)
    return index < 0 ? '' : String(row[index] ?? '').trim()
  }

  return { find, read }
}

export function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, function keepUnits(match) {
      return ' ' + match.slice(1, -1) + ' '
    })
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()
}
