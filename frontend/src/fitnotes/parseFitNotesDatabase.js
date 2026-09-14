import { loadSqliteEngine } from './sqliteEngine'
import { ensureRequiredTables, normalizeDate, tableRows } from './sqliteHelpers'

export async function parseFitNotesDatabase(file, bytes) {
  const SQL = await loadSqliteEngine()
  const database = new SQL.Database(bytes)

  try {
    ensureRequiredTables(database)
    return buildDatabaseImport(file, database)
  } finally {
    database.close()
  }
}

function buildDatabaseImport(file, database) {
  const exercises = readRows(database, 'exercise', mapExercise, compareIds)
  const workoutSets = readWorkoutSets(database, exercises)

  return {
    summary: createSummary(file, exercises, workoutSets),
    exercises,
    workoutSets,
    categories: readRows(database, 'Category', mapCategory, compareSortOrder),
    bodyWeights: readRows(database, 'BodyWeight', mapBodyWeight, compareDatesAndIds),
    measurements: readRows(database, 'Measurement', mapMeasurement, compareSortOrder),
    measurementUnits: readRows(database, 'MeasurementUnit', mapMeasurementUnit, compareIds),
    measurementRecords: readRows(database, 'MeasurementRecord', mapMeasurementRecord, compareDatesTimesAndIds),
    workoutTimes: readRows(database, 'WorkoutTime', mapWorkoutTime, compareDatesAndIds),
    workoutComments: readRows(database, 'WorkoutComment', mapWorkoutComment, compareDatesAndIds),
    routines: readRows(database, 'Routine', mapRoutine, compareIds),
    routineSections: readRows(database, 'RoutineSection', mapRoutineSection, compareRoutineSections),
    routineSectionExercises: readRows(
      database,
      'RoutineSectionExercise',
      mapRoutineSectionExercise,
      compareRoutineSectionExercises,
    ),
    routineSectionExerciseSets: readRows(
      database,
      'RoutineSectionExerciseSet',
      mapRoutineSectionExerciseSet,
      compareRoutineSectionExerciseSets,
    ),
  }
}

function readRows(database, tableName, mapper, compare) {
  const rows = tableRows(database, tableName)
  const mappedRows = []
  for (const row of rows) mappedRows.push(mapper(row))
  mappedRows.sort(compare)
  return mappedRows
}

function readWorkoutSets(database, exercises) {
  const namesById = new Map()
  for (const exercise of exercises) namesById.set(exercise.id, exercise.name)

  const rows = tableRows(database, 'training_log')
  rows.sort(compareSourceSets)
  const order = createWorkoutOrder()
  const workoutSets = []

  for (const row of rows) {
    const exerciseId = readNumber(row, ['exercise_id', 'exerciseId'])
    const date = readDate(row, ['date'])
    const positions = order.next(date, exerciseId)

    workoutSets.push({
      id: readNumber(row, ['_id', 'id']),
      exerciseId,
      exerciseName: namesById.get(exerciseId) ?? '',
      date,
      weight: readNumber(row, ['metric_weight', 'weight'], 0),
      reps: readNumber(row, ['reps'], 0),
      unit: readNumber(row, ['unit'], 0),
      routineSectionExerciseSetId: readNumber(row, ['routine_section_exercise_set_id'], 0),
      timerAutoStart: readNumber(row, ['timer_auto_start'], 0),
      isPersonalRecord: readNumber(row, ['is_personal_record'], 0),
      isPersonalRecordFirst: readNumber(row, ['is_personal_record_first'], 0),
      isComplete: readNumber(row, ['is_complete'], 1),
      distance: readNumber(row, ['distance'], 0),
      durationSeconds: readNumber(row, ['duration_seconds'], 0),
      dayExerciseOrder: positions.exercise,
      localSetOrder: positions.set,
    })
  }

  return workoutSets
}

function mapExercise(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    name: readText(row, ['name']),
    categoryId: readNumber(row, ['category_id', 'categoryId']),
    exerciseTypeId: readNumber(row, ['exercise_type_id', 'exerciseTypeId'], 0),
    notes: readNullable(row, ['notes']),
    weightIncrement: readNumber(row, ['weight_increment', 'weightIncrement']),
    defaultGraphId: readNumber(row, ['default_graph_id', 'defaultGraphId']),
    defaultRestTime: readNumber(row, ['default_rest_time', 'defaultRestTime']),
  }
}

function mapCategory(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    name: readText(row, ['name']),
    colour: readNumber(row, ['colour', 'color'], 0),
    sortOrder: readNumber(row, ['sort_order', 'sortOrder'], 0),
  }
}

function mapBodyWeight(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    date: readDate(row, ['date']),
    bodyWeightMetric: readNumber(row, ['body_weight_metric', 'bodyWeightMetric']),
    bodyFat: readNumber(row, ['body_fat', 'bodyFat']),
    comments: readNullable(row, ['comments', 'comment']),
  }
}

function mapMeasurement(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    name: readText(row, ['name']),
    unitId: readNumber(row, ['unit_id', 'unitId'], 0),
    goalType: readNumber(row, ['goal_type', 'goalType'], 0),
    goalValue: readNumber(row, ['goal_value', 'goalValue'], 0),
    custom: readNumber(row, ['custom'], 0),
    enabled: readNumber(row, ['enabled'], 1),
    sortOrder: readNumber(row, ['sort_order', 'sortOrder'], 0),
  }
}

function mapMeasurementUnit(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    type: readNumber(row, ['type'], 0),
    longName: readText(row, ['long_name', 'longName']),
    shortName: readText(row, ['short_name', 'shortName']),
  }
}

function mapMeasurementRecord(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    measurementId: readNumber(row, ['measurement_id', 'measurementId']),
    date: readDate(row, ['date']),
    time: readText(row, ['time']),
    value: readNumber(row, ['value']),
    comment: readNullable(row, ['comment', 'comments']),
  }
}

function mapWorkoutTime(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    date: readDate(row, ['workout_date', 'date']),
    startDateTime: readNullable(row, ['start_date_time', 'startDateTime']),
    endDateTime: readNullable(row, ['end_date_time', 'endDateTime']),
  }
}

function mapWorkoutComment(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    date: readDate(row, ['date', 'workout_date']),
    comment: readNullable(row, ['comment', 'comments']),
  }
}

function mapRoutine(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    name: readText(row, ['name']),
    notes: readNullable(row, ['notes']),
  }
}

function mapRoutineSection(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    routineId: readNumber(row, ['routine_id', 'routineId']),
    name: readText(row, ['name']),
    sortOrder: readNumber(row, ['sort_order', 'sortOrder'], 0),
  }
}

function mapRoutineSectionExercise(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    routineSectionId: readNumber(row, ['routine_section_id', 'routineSectionId']),
    exerciseId: readNumber(row, ['exercise_id', 'exerciseId']),
    sortOrder: readNumber(row, ['sort_order', 'sortOrder'], 0),
    populateSetsType: readNumber(row, ['populate_sets_type', 'populateSetsType'], 0),
  }
}

function mapRoutineSectionExerciseSet(row) {
  return {
    id: readNumber(row, ['_id', 'id']),
    routineSectionExerciseId: readNumber(row, ['routine_section_exercise_id', 'routineSectionExerciseId']),
    weight: readNumber(row, ['metric_weight', 'weight'], 0),
    reps: readNumber(row, ['reps'], 0),
    sortOrder: readNumber(row, ['sort_order', 'sortOrder'], 0),
    distance: readNumber(row, ['distance'], 0),
    durationSeconds: readNumber(row, ['duration_seconds', 'durationSeconds'], 0),
    unit: readNumber(row, ['unit'], 0),
  }
}

function createSummary(file, exercises, workoutSets) {
  const dates = []
  for (const set of workoutSets) {
    if (set.date) dates.push(set.date)
  }
  dates.sort()

  return {
    fileName: file.name,
    totalSets: workoutSets.length,
    totalExercises: exercises.length,
    firstWorkoutDate: dates[0] ?? null,
    lastWorkoutDate: dates.at(-1) ?? null,
    backupStored: true,
    migratedFromLocalStorage: false,
    importFormat: 'sqlite',
  }
}

function createWorkoutOrder() {
  const exerciseOrders = new Map()
  const setCounts = new Map()

  function next(date, exerciseId) {
    const dayOrders = exerciseOrders.get(date) ?? new Map()
    if (!dayOrders.has(exerciseId)) dayOrders.set(exerciseId, dayOrders.size)
    exerciseOrders.set(date, dayOrders)

    const setKey = date + '::' + exerciseId
    const setOrder = setCounts.get(setKey) ?? 0
    setCounts.set(setKey, setOrder + 1)
    return { exercise: dayOrders.get(exerciseId), set: setOrder }
  }

  return { next }
}

function readDate(row, names) {
  const value = readValue(row, names)
  return normalizeDate(value) ?? readText(row, names)
}

function readNumber(row, names, fallback = null) {
  const value = readValue(row, names)
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function readText(row, names, fallback = '') {
  const value = readValue(row, names)
  return value === null || value === undefined ? fallback : String(value)
}

function readNullable(row, names) {
  const value = readValue(row, names)
  return value === undefined ? null : value
}

function readValue(row, names) {
  for (const name of names) {
    if (Object.hasOwn(row, name)) return row[name]
  }

  const wantedNames = new Set()
  for (const name of names) wantedNames.add(normalizeColumnName(name))
  for (const [name, value] of Object.entries(row)) {
    if (wantedNames.has(normalizeColumnName(name))) return value
  }
  return undefined
}

function normalizeColumnName(value) {
  return String(value).replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function compareIds(first, second) {
  return orderNumber(first.id) - orderNumber(second.id)
}

function compareSortOrder(first, second) {
  return orderNumber(first.sortOrder) - orderNumber(second.sortOrder) || compareIds(first, second)
}

function compareSourceSets(first, second) {
  const dateComparison = readText(first, ['date']).localeCompare(readText(second, ['date']))
  if (dateComparison !== 0) return dateComparison
  return orderNumber(readNumber(first, ['_id', 'id'])) - orderNumber(readNumber(second, ['_id', 'id']))
}

function compareDatesAndIds(first, second) {
  return String(first.date).localeCompare(String(second.date)) || compareIds(first, second)
}

function compareDatesTimesAndIds(first, second) {
  return compareDatesAndIds(first, second) || String(first.time).localeCompare(String(second.time))
}

function compareRoutineSections(first, second) {
  return orderNumber(first.routineId) - orderNumber(second.routineId) || compareSortOrder(first, second)
}

function compareRoutineSectionExercises(first, second) {
  return orderNumber(first.routineSectionId) - orderNumber(second.routineSectionId)
    || compareSortOrder(first, second)
}

function compareRoutineSectionExerciseSets(first, second) {
  return orderNumber(first.routineSectionExerciseId) - orderNumber(second.routineSectionExerciseId)
    || compareSortOrder(first, second)
}

function orderNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER
}
