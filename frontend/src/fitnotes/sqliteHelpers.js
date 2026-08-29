export function ensureRequiredTables(db) {
  for (const tableName of ['training_log', 'exercise']) {
    if (!hasTable(db, tableName)) throw new Error(`The backup does not contain the required table '${tableName}'.`)
  }
}

function hasTable(db, tableName) {
  const statement = db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1;`)
  try {
    statement.bind([tableName])
    return statement.step()
  } finally {
    statement.free()
  }
}

export function optionalRows(db, tableName, sql) {
  return hasTable(db, tableName) ? queryRows(db, sql) : []
}

export function queryRows(db, sql) {
  const statement = db.prepare(sql)
  const rows = []
  try {
    while (statement.step()) rows.push(statement.getAsObject())
  } finally {
    statement.free()
  }
  return rows
}

export function scalarValue(db, sql) {
  const result = db.exec(sql)
  return result[0]?.values?.[0]?.[0] ?? null
}

export function normalizeObjectNumbers(row) {
  const result = {}
  for (const [key, value] of Object.entries(row)) {
    result[key] = typeof value === 'number' ? Number(value) : value
  }
  return result
}

export function normalizeDate(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (!text) return null

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return text

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
