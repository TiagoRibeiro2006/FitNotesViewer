import { EXPORT_TABLES } from './exportTables.js'
import { queryRows } from './sqliteHelpers.js'

export function synchronizeFitNotesDatabase(db, data) {
  const tables = EXPORT_TABLES.map((definition) => prepareTable(db, definition, data[definition.store]))
  const maps = new Map(tables.map((table) => [table.store, table.ids]))
  // Called within the export transaction; delete children before their parents.
  for (const table of [...tables].reverse()) removeDeletedRows(db, table)
  for (const table of tables) writeRows(db, table, maps)
}

function prepareTable(db, definition, rows) {
  if (!Array.isArray(rows)) throw new Error(`Missing export data: ${definition.store}.`)
  const columns = queryRows(db, `PRAGMA table_info(${quote(definition.table)});`)
  if (!columns.length && rows.length) {
    throw new Error(`This backup has no ${definition.table} table to store your changes. The export was cancelled without changing your saved data.`)
  }
  const key = columns.find((column) => column.pk)?.name
  if (columns.length && !key) throw new Error(`The ${definition.table} table has no primary key.`)
  const stored = key ? queryRows(db, `SELECT ${quote(key)} AS id FROM ${quote(definition.table)};`) : []
  const storedIds = new Set(stored.map((row) => row.id))
  let nextId = 0
  for (const id of [...storedIds, ...rows.map((row) => row.id)]) {
    if (Number.isSafeInteger(id)) nextId = Math.max(nextId, id)
  }
  if (definition.store === 'workoutSets') rows = [...rows].sort(compareWorkoutSets)
  const ids = new Map()
  for (const row of rows) {
    if (ids.has(row.id)) throw new Error(`Duplicate ID in ${definition.store}.`)
    ids.set(row.id, Number.isSafeInteger(row.id) ? row.id : ++nextId)
  }
  return { ...definition, rows, columns, key, ids, storedIds }
}

function removeDeletedRows(db, table) {
  if (!table.key) return
  const kept = new Set(table.ids.values())
  const statement = db.prepare(`DELETE FROM ${quote(table.table)} WHERE ${quote(table.key)} = ?;`)
  try {
    for (const id of table.storedIds) if (!kept.has(id)) statement.run([id])
  } finally {
    statement.free()
  }
}

function writeRows(db, table, maps) {
  for (const row of table.rows) {
    const id = table.ids.get(row.id)
    const existing = table.storedIds.has(id)
    const values = new Map()
    for (const [name, field] of Object.entries(table.fields)) {
      const column = table.columns.find((item) => normalize(item.name) === normalize(name)
        || normalize(item.name) === normalize(field))
      if (!column || row[field] === undefined) continue
      let value = row[field]
      const parent = table.references?.[field]
      if (parent && value !== null && value !== 0) {
        const mapped = maps.get(parent)?.get(value)
        if (mapped === undefined) throw new Error(`Missing ${parent} reference in ${table.store}.`)
        value = mapped
      }
      if (value === null && column.notnull && column.dflt_value !== null) {
        if (!existing) continue
        value = queryRows(db, `SELECT ${column.dflt_value} AS value;`)[0].value
      }
      values.set(column.name, value)
    }
    if (existing) {
      if (!values.size) continue
      db.run(`UPDATE ${quote(table.table)} SET ${[...values.keys()].map((name) => `${quote(name)} = ?`).join(', ')} WHERE ${quote(table.key)} = ?;`, [...values.values(), id])
    } else {
      values.set(table.key, id)
      db.run(`INSERT INTO ${quote(table.table)} (${[...values.keys()].map(quote).join(', ')}) VALUES (${[...values].map(() => '?').join(', ')});`, [...values.values()])
    }
  }
}

function normalize(name) {
  return name.replace(/_/g, '').toLowerCase()
}

function quote(name) {
  return '"' + String(name).replaceAll('"', '""') + '"'
}

function compareWorkoutSets(a, b) {
  return String(a.date).localeCompare(String(b.date))
    || order(a.dayExerciseOrder) - order(b.dayExerciseOrder)
    || order(a.localSetOrder) - order(b.localSetOrder)
}

function order(value) {
  return Number.isInteger(value) ? value : Number.MAX_SAFE_INTEGER
}
