import { validateSqliteDatabase } from './fitNotesValidation'
import { loadSqliteEngine } from './sqliteEngine'
import { ensureRequiredTables, queryRows } from './sqliteHelpers'

export async function createFitNotesExport(sourceBytes, workoutSets = []) {
  const bytes = sourceBytes instanceof Uint8Array ? sourceBytes : new Uint8Array(sourceBytes)
  validateSqliteDatabase(bytes)

  const SQL = await loadSqliteEngine()
  const db = new SQL.Database(bytes)

  try {
    ensureRequiredTables(db)
    db.run('BEGIN TRANSACTION;')

    try {
      synchronizeWorkoutSets(db, workoutSets)
      db.run('COMMIT;')
    } catch (error) {
      db.run('ROLLBACK;')
      throw error
    }

    return db.export()
  } finally {
    db.close()
  }
}

function synchronizeWorkoutSets(db, workoutSets) {
  const sourceIds = new Set(
    workoutSets
      .filter((set) => typeof set.id === 'number' && Number.isInteger(set.id))
      .map((set) => set.id),
  )
  const storedRows = queryRows(db, 'SELECT _id AS id FROM training_log;')
  const deleteStatement = db.prepare('DELETE FROM training_log WHERE _id = ?;')

  try {
    for (const row of storedRows) {
      if (!sourceIds.has(row.id)) deleteStatement.run([row.id])
    }
  } finally {
    deleteStatement.free()
  }

  const localSets = workoutSets
    .filter((set) => typeof set.id !== 'number')
    .sort(compareLocalWorkoutSets)
  const insertStatement = db.prepare(`
    INSERT INTO training_log (
      exercise_id,
      date,
      metric_weight,
      reps,
      unit,
      routine_section_exercise_set_id,
      timer_auto_start,
      is_personal_record,
      is_personal_record_first,
      is_complete,
      is_pending_update,
      distance,
      duration_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `)

  try {
    for (const set of localSets) {
      insertStatement.run([
        Number(set.exerciseId),
        String(set.date),
        Number(set.weight),
        Number(set.reps),
        Number(set.unit ?? 0),
        Number(set.routineSectionExerciseSetId ?? 0),
        Number(set.timerAutoStart ?? 0),
        Number(set.isPersonalRecord ?? 0),
        Number(set.isPersonalRecordFirst ?? 0),
        Number(set.isComplete ?? 1),
        0,
        Number(set.distance ?? 0),
        Number(set.durationSeconds ?? 0),
      ])
    }
  } finally {
    insertStatement.free()
  }
}

function compareLocalWorkoutSets(a, b) {
  const dateComparison = String(a.date).localeCompare(String(b.date))
  if (dateComparison !== 0) return dateComparison

  const exerciseOrderA = Number.isInteger(Number(a.dayExerciseOrder)) ? Number(a.dayExerciseOrder) : Number.MAX_SAFE_INTEGER
  const exerciseOrderB = Number.isInteger(Number(b.dayExerciseOrder)) ? Number(b.dayExerciseOrder) : Number.MAX_SAFE_INTEGER
  if (exerciseOrderA !== exerciseOrderB) return exerciseOrderA - exerciseOrderB

  const setOrderA = Number.isInteger(Number(a.localSetOrder)) ? Number(a.localSetOrder) : Number.MAX_SAFE_INTEGER
  const setOrderB = Number.isInteger(Number(b.localSetOrder)) ? Number(b.localSetOrder) : Number.MAX_SAFE_INTEGER
  return setOrderA - setOrderB
}

