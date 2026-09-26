const DELIMITERS = [',', ';', '\t']

export function readCsv(text) {
  const content = removeByteOrderMark(String(text ?? ''))
  const delimiter = detectDelimiter(content)
  const rows = parseRows(content, delimiter)
  return removeEmptyRows(rows)
}

function detectDelimiter(text) {
  const counts = new Map()
  for (const delimiter of DELIMITERS) counts.set(delimiter, 0)

  let insideQuotes = false
  for (const character of text) {
    if (character === '"') insideQuotes = !insideQuotes
    if (!insideQuotes && (character === '\n' || character === '\r')) break
    if (!insideQuotes && counts.has(character)) {
      counts.set(character, counts.get(character) + 1)
    }
  }

  let selected = ','
  for (const delimiter of DELIMITERS) {
    if (counts.get(delimiter) > counts.get(selected)) selected = delimiter
  }
  return selected
}

function parseRows(text, delimiter) {
  const rows = []
  let row = []
  let field = ''
  let insideQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (character === '"') {
      if (insideQuotes && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (!insideQuotes && character === delimiter) {
      row.push(field)
      field = ''
      continue
    }

    if (!insideQuotes && (character === '\n' || character === '\r')) {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      if (character === '\r' && text[index + 1] === '\n') index += 1
      continue
    }

    field += character
  }

  if (insideQuotes) throw new Error('The CSV contains an unfinished quoted value.')
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function removeEmptyRows(rows) {
  const populatedRows = []
  for (const row of rows) {
    if (row.some(hasText)) populatedRows.push(row)
  }
  return populatedRows
}

function hasText(value) {
  return String(value).trim() !== ''
}

function removeByteOrderMark(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}
