import { createCsvColumns } from './csv/csvColumns.js'
import { readCsv } from './csv/readCsv.js'
import {
  parseCsvDate,
  parseCsvNumber,
  parseDurationSeconds,
  readMetricWeight,
  readMetricDistance,
} from './csv/csvValues.js'

const CATEGORY_COLOURS = [
  -7453523,
  -14176672,
  -812014,
  -4179669,
  -14057287,
  -11226442,
  -13877680,
  -8418163,
]

export function parseFitNotesCsv(file, text) {
  const rows = readCsv(text)
  if (rows.length < 2) throw new Error('The CSV does not contain any workout sets.')

  const columns = createCsvColumns(rows[0])
  validateWorkoutColumns(columns)
  const builder = createImportBuilder()

  for (let index = 1; index < rows.length; index += 1) {
    builder.add(rows[index], columns, index + 1)
  }

  return builder.finish(file)
}

function validateWorkoutColumns(columns) {
  if (columns.find(['Date', 'Log Date', 'Workout Date']) < 0) {
    throw new Error('The CSV needs a Date or Log Date column.')
  }
  if (columns.find(['Exercise', 'Exercise Name', 'Exercise Title']) < 0) {
    throw new Error('The CSV needs an Exercise column.')
  }

  const setColumns = [
    'Weight',
    'Weight (kg)',
    'Weight (kgs)',
    'Weight (kilograms)',
    'Weight (lbs)',
    'Weight (pounds)',
    'Reps',
    'Rep',
    'Repetitions',
    'Distance',
    'Time',
    'Duration',
    'Duration (seconds)',
  ]
  if (columns.find(setColumns) < 0) {
    throw new Error('The CSV needs at least one weight, reps, distance or time column.')
  }
}

function createImportBuilder() {
  const categories = []
  const exercises = []
  const workoutSets = []
  const categoryIds = new Map()
  const exerciseIds = new Map()
  const workoutOrder = createWorkoutOrder()

  function add(row, columns, rowNumber) {
    const date = parseCsvDate(columns.read(row, ['Date', 'Log Date', 'Workout Date']), rowNumber)
    const exerciseName = requiredText(
      columns.read(row, ['Exercise', 'Exercise Name', 'Exercise Title']),
      'exercise name',
      rowNumber,
    )
    const categoryName = columns.read(row, ['Category', 'Muscle', 'Muscle Group']) || 'Other'
    const categoryId = getCategoryId(categoryName)
    const exerciseId = getExerciseId(exerciseName, categoryId)
    const positions = workoutOrder.next(date, exerciseId)
    const weight = readMetricWeight(row, columns, rowNumber)
    const reps = parseCsvNumber(
      columns.read(row, ['Reps', 'Rep', 'Repetitions']),
      'reps',
      rowNumber,
    )
    const distance = readMetricDistance(row, columns, rowNumber)
    const durationSeconds = parseDurationSeconds(
      columns.read(row, ['Time', 'Duration', 'Duration (seconds)', 'Duration Seconds']),
      rowNumber,
    )

    updateExerciseType(exerciseId, weight, reps, distance, durationSeconds)
    workoutSets.push({
      id: workoutSets.length + 1,
      exerciseId,
      exerciseName,
      date,
      weight,
      reps,
      unit: 0,
      routineSectionExerciseSetId: 0,
      timerAutoStart: 0,
      isPersonalRecord: 0,
      isPersonalRecordFirst: 0,
      isComplete: 1,
      distance,
      durationSeconds,
      dayExerciseOrder: positions.exercise,
      localSetOrder: positions.set,
    })
  }

  function getCategoryId(name) {
    const key = normalizeName(name)
    if (categoryIds.has(key)) return categoryIds.get(key)

    const id = categories.length + 1
    categoryIds.set(key, id)
    categories.push({
      id,
      name: cleanName(name),
      colour: CATEGORY_COLOURS[categories.length % CATEGORY_COLOURS.length],
      sortOrder: categories.length,
    })
    return id
  }

  function getExerciseId(name, categoryId) {
    const key = normalizeName(name)
    if (exerciseIds.has(key)) return exerciseIds.get(key)

    const id = exercises.length + 1
    exerciseIds.set(key, id)
    exercises.push({
      id,
      name: cleanName(name),
      categoryId,
      exerciseTypeId: 0,
      notes: null,
      weightIncrement: null,
      defaultGraphId: null,
      defaultRestTime: null,
    })
    return id
  }

  function updateExerciseType(exerciseId, weight, reps, distance, durationSeconds) {
    const exercise = exercises[exerciseId - 1]
    if (!exercise || exercise.exerciseTypeId !== 0) return
    if (distance > 0) exercise.exerciseTypeId = 1
    if (durationSeconds > 0 && weight === 0 && reps === 0) exercise.exerciseTypeId = 3
  }

  function finish(file) {
    if (!workoutSets.length) throw new Error('The CSV does not contain any workout sets.')
    const dates = workoutSets.map(readSetDate).sort()

    return {
      summary: {
        fileName: file.name,
        totalSets: workoutSets.length,
        totalExercises: exercises.length,
        firstWorkoutDate: dates[0] ?? null,
        lastWorkoutDate: dates.at(-1) ?? null,
        backupStored: false,
        migratedFromLocalStorage: false,
        importFormat: 'csv',
      },
      exercises,
      workoutSets,
      categories,
      bodyWeights: [],
      measurements: [],
      measurementUnits: [],
      measurementRecords: [],
      workoutTimes: [],
      workoutComments: [],
      routines: [],
      routineSections: [],
      routineSectionExercises: [],
      routineSectionExerciseSets: [],
    }
  }

  return { add, finish }
}

function createWorkoutOrder() {
  const exerciseOrders = new Map()
  const setCounts = new Map()

  function next(date, exerciseId) {
    const dayOrders = exerciseOrders.get(date) ?? new Map()
    if (!dayOrders.has(exerciseId)) dayOrders.set(exerciseId, dayOrders.size)
    exerciseOrders.set(date, dayOrders)

    const key = date + '::' + exerciseId
    const setOrder = setCounts.get(key) ?? 0
    setCounts.set(key, setOrder + 1)
    return { exercise: dayOrders.get(exerciseId), set: setOrder }
  }

  return { next }
}

function requiredText(value, label, rowNumber) {
  const text = cleanName(value)
  if (!text) throw new Error('CSV row ' + rowNumber + ' has no ' + label + '.')
  return text
}

function cleanName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function normalizeName(value) {
  return cleanName(value).toLocaleLowerCase()
}

function readSetDate(set) {
  return set.date
}
