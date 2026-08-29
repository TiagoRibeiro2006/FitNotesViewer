import { validateFitNotesFile, validateSqliteDatabase } from './fitNotesValidation'
import { loadSqliteEngine } from './sqliteEngine'
import {
  ensureRequiredTables,
  normalizeDate,
  normalizeObjectNumbers,
  optionalRows,
  queryRows,
  scalarValue,
} from './sqliteHelpers'

export async function parseFitNotesFile(file) {
  validateFitNotesFile(file)

  const bytes = new Uint8Array(await file.arrayBuffer())
  validateSqliteDatabase(bytes)

  const SQL = await loadSqliteEngine()
  const db = new SQL.Database(bytes)

  try {
    ensureRequiredTables(db)

    const exercises = queryRows(db, `
      SELECT
        _id AS id,
        name,
        category_id AS categoryId,
        exercise_type_id AS exerciseTypeId,
        notes,
        weight_increment AS weightIncrement,
        default_graph_id AS defaultGraphId,
        default_rest_time AS defaultRestTime
      FROM exercise
      ORDER BY _id;
    `).map(normalizeObjectNumbers)

    const workoutSets = queryRows(db, `
      SELECT
        tl._id AS id,
        tl.exercise_id AS exerciseId,
        e.name AS exerciseName,
        tl.date AS date,
        tl.metric_weight AS weight,
        tl.reps AS reps,
        tl.unit AS unit,
        tl.routine_section_exercise_set_id AS routineSectionExerciseSetId,
        tl.timer_auto_start AS timerAutoStart,
        tl.is_personal_record AS isPersonalRecord,
        tl.is_personal_record_first AS isPersonalRecordFirst,
        tl.is_complete AS isComplete,
        tl.distance AS distance,
        tl.duration_seconds AS durationSeconds
      FROM training_log tl
      INNER JOIN exercise e ON e._id = tl.exercise_id
      ORDER BY tl.date ASC, tl._id ASC;
    `).map((row) => ({
      ...normalizeObjectNumbers(row),
      exerciseName: String(row.exerciseName ?? ''),
      date: normalizeDate(row.date) ?? String(row.date ?? ''),
    }))

    const categories = optionalRows(db, 'Category', `
      SELECT _id AS id, name, colour, sort_order AS sortOrder
      FROM Category ORDER BY sort_order, _id;
    `).map(normalizeObjectNumbers)

    const bodyWeights = optionalRows(db, 'BodyWeight', `
      SELECT
        _id AS id,
        date,
        body_weight_metric AS bodyWeightMetric,
        body_fat AS bodyFat,
        comments
      FROM BodyWeight ORDER BY date, _id;
    `).map((row) => ({ ...normalizeObjectNumbers(row), date: normalizeDate(row.date) ?? String(row.date ?? '') }))

    const measurements = optionalRows(db, 'Measurement', `
      SELECT
        _id AS id,
        name,
        unit_id AS unitId,
        goal_type AS goalType,
        goal_value AS goalValue,
        custom,
        enabled,
        sort_order AS sortOrder
      FROM Measurement ORDER BY sort_order, _id;
    `).map(normalizeObjectNumbers)

    const measurementUnits = optionalRows(db, 'MeasurementUnit', `
      SELECT
        _id AS id,
        type,
        long_name AS longName,
        short_name AS shortName
      FROM MeasurementUnit ORDER BY _id;
    `).map(normalizeObjectNumbers)

    const measurementRecords = optionalRows(db, 'MeasurementRecord', `
      SELECT
        _id AS id,
        measurement_id AS measurementId,
        date,
        time,
        value,
        comment
      FROM MeasurementRecord ORDER BY date, time, _id;
    `).map((row) => ({ ...normalizeObjectNumbers(row), date: normalizeDate(row.date) ?? String(row.date ?? '') }))

    const workoutTimes = optionalRows(db, 'WorkoutTime', `
      SELECT
        _id AS id,
        workout_date AS date,
        start_date_time AS startDateTime,
        end_date_time AS endDateTime
      FROM WorkoutTime ORDER BY workout_date, _id;
    `).map((row) => ({ ...normalizeObjectNumbers(row), date: normalizeDate(row.date) ?? String(row.date ?? '') }))

    const workoutComments = optionalRows(db, 'WorkoutComment', `
      SELECT _id AS id, date, comment
      FROM WorkoutComment ORDER BY date, _id;
    `).map((row) => ({ ...normalizeObjectNumbers(row), date: normalizeDate(row.date) ?? String(row.date ?? '') }))

    const routines = optionalRows(db, 'Routine', `
      SELECT _id AS id, name, notes
      FROM Routine ORDER BY _id;
    `).map(normalizeObjectNumbers)

    const routineSections = optionalRows(db, 'RoutineSection', `
      SELECT _id AS id, routine_id AS routineId, name, sort_order AS sortOrder
      FROM RoutineSection ORDER BY routine_id, sort_order, _id;
    `).map(normalizeObjectNumbers)

    const routineSectionExercises = optionalRows(db, 'RoutineSectionExercise', `
      SELECT
        _id AS id,
        routine_section_id AS routineSectionId,
        exercise_id AS exerciseId,
        sort_order AS sortOrder,
        populate_sets_type AS populateSetsType
      FROM RoutineSectionExercise ORDER BY routine_section_id, sort_order, _id;
    `).map(normalizeObjectNumbers)

    const routineSectionExerciseSets = optionalRows(db, 'RoutineSectionExerciseSet', `
      SELECT
        _id AS id,
        routine_section_exercise_id AS routineSectionExerciseId,
        metric_weight AS weight,
        reps,
        sort_order AS sortOrder,
        distance,
        duration_seconds AS durationSeconds,
        unit
      FROM RoutineSectionExerciseSet ORDER BY routine_section_exercise_id, sort_order, _id;
    `).map(normalizeObjectNumbers)

    const summary = {
      fileName: file.name,
      totalSets: workoutSets.length,
      totalExercises: exercises.length,
      firstWorkoutDate: normalizeDate(scalarValue(db, 'SELECT MIN(date) FROM training_log;')),
      lastWorkoutDate: normalizeDate(scalarValue(db, 'SELECT MAX(date) FROM training_log;')),
      backupStored: true,
      migratedFromLocalStorage: false,
    }

    return {
      bytes,
      parsed: {
        summary,
        exercises,
        workoutSets,
        categories,
        bodyWeights,
        measurements,
        measurementUnits,
        measurementRecords,
        workoutTimes,
        workoutComments,
        routines,
        routineSections,
        routineSectionExercises,
        routineSectionExerciseSets,
      },
    }
  } finally {
    db.close()
  }
}

