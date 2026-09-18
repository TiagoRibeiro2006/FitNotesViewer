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
  if (columns.find(['Record Type']) >= 0) return parseExtendedCsv(file, rows, columns)

  validateWorkoutColumns(columns)
  const builder = createImportBuilder()

  for (let index = 1; index < rows.length; index += 1) {
    builder.add(rows[index], columns, index + 1)
  }

  return builder.finish(file)
}


function parseExtendedCsv(file, rows, columns) {
  const workoutBuilder = createImportBuilder()
  const bodyWeights = []
  const measurements = []
  const measurementUnits = []
  const measurementRecords = []
  const unitsById = new Map()
  const unitsByName = new Map()
  const measurementsById = new Map()
  const measurementsByName = new Map()

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    const type = normalizeRecordType(columns.read(row, ['Record Type']))

    if (type === 'body unit') addBodyUnit(row, columns, rowNumber)
  }

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    const type = normalizeRecordType(columns.read(row, ['Record Type']))

    if (type === 'body definition') addBodyDefinition(row, columns, rowNumber)
  }

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 1
    const type = normalizeRecordType(columns.read(row, ['Record Type']))

    if (!type || type === 'workout') {
      workoutBuilder.add(row, columns, rowNumber)
      continue
    }
    if (type === 'body measurement') {
      addBodyMeasurement(row, columns, rowNumber)
      continue
    }
    if (type === 'legacy body weight' || type === 'body weight') {
      addLegacyBodyWeight(row, columns, rowNumber)
    }
  }

  const parsed = workoutBuilder.finish(file, true)
  parsed.bodyWeights = bodyWeights
  parsed.measurements = measurements
  parsed.measurementUnits = measurementUnits
  parsed.measurementRecords = measurementRecords
  parsed.summary.importFormat = 'csv'
  parsed.summary.totalBodyRecords = bodyWeights.length + measurementRecords.length

  if (!parsed.workoutSets.length && !bodyWeights.length && !measurementRecords.length && !measurements.length) {
    throw new Error('The CSV does not contain any importable workout or body data.')
  }
  return parsed

  function addBodyUnit(row, csvColumns, rowNumber) {
    const rawId = csvColumns.read(row, ['Measurement Unit ID'])
    const shortName = csvColumns.read(row, ['Measurement Unit', 'Unit'])
    const longName = csvColumns.read(row, ['Measurement Unit Long Name']) || shortName
    const id = parseCsvId(rawId, `csv-body-unit-${measurementUnits.length + 1}`)
    const key = idKey(id)
    if (unitsById.has(key)) return unitsById.get(key)

    const unit = {
      id,
      type: parseWholeNumber(csvColumns.read(row, ['Measurement Unit Type']), 0, 'measurement unit type', rowNumber),
      longName,
      shortName,
    }
    measurementUnits.push(unit)
    unitsById.set(key, unit)
    if (shortName) unitsByName.set(normalizeName(shortName), unit)
    return unit
  }

  function ensureUnit(row, csvColumns, rowNumber) {
    const rawId = csvColumns.read(row, ['Measurement Unit ID'])
    if (rawId) {
      const parsedId = parseCsvId(rawId, rawId)
      const existing = unitsById.get(idKey(parsedId))
      if (existing) return existing
    }

    const shortName = csvColumns.read(row, ['Measurement Unit', 'Unit'])
    const existingByName = unitsByName.get(normalizeName(shortName))
    if (existingByName) return existingByName

    return addBodyUnit(row, csvColumns, rowNumber)
  }

  function addBodyDefinition(row, csvColumns, rowNumber) {
    const rawId = csvColumns.read(row, ['Measurement ID'])
    const name = requiredText(csvColumns.read(row, ['Measurement']), 'measurement name', rowNumber)
    const id = parseCsvId(rawId, `csv-body-measurement-${measurements.length + 1}`)
    const key = idKey(id)
    if (measurementsById.has(key)) return measurementsById.get(key)

    const unit = ensureUnit(row, csvColumns, rowNumber)
    const measurement = {
      id,
      localBodyId: csvColumns.read(row, ['Local Body ID']) || undefined,
      name,
      unitId: unit.id,
      goalType: parseWholeNumber(csvColumns.read(row, ['Measurement Goal Type']), 0, 'measurement goal type', rowNumber),
      goalValue: parseCsvNumber(csvColumns.read(row, ['Measurement Goal Value']), 'measurement goal value', rowNumber),
      custom: parseWholeNumber(csvColumns.read(row, ['Measurement Custom']), 0, 'measurement custom flag', rowNumber),
      enabled: parseWholeNumber(csvColumns.read(row, ['Measurement Enabled']), 1, 'measurement enabled flag', rowNumber),
      sortOrder: parseWholeNumber(csvColumns.read(row, ['Measurement Sort Order']), measurements.length, 'measurement sort order', rowNumber),
    }
    measurements.push(measurement)
    measurementsById.set(key, measurement)
    measurementsByName.set(normalizeName(name), measurement)
    return measurement
  }

  function ensureMeasurement(row, csvColumns, rowNumber) {
    const rawId = csvColumns.read(row, ['Measurement ID'])
    if (rawId) {
      const parsedId = parseCsvId(rawId, rawId)
      const existing = measurementsById.get(idKey(parsedId))
      if (existing) return existing
    }

    const name = csvColumns.read(row, ['Measurement'])
    const existingByName = measurementsByName.get(normalizeName(name))
    if (existingByName) return existingByName
    return addBodyDefinition(row, csvColumns, rowNumber)
  }

  function addBodyMeasurement(row, csvColumns, rowNumber) {
    const measurement = ensureMeasurement(row, csvColumns, rowNumber)
    const valueText = csvColumns.read(row, ['Measurement Value', 'Value'])
    if (!valueText) return
    measurementRecords.push({
      id: parseCsvId(csvColumns.read(row, ['Record ID']), `csv-body-record-${measurementRecords.length + 1}`),
      measurementId: measurement.id,
      date: parseCsvDate(csvColumns.read(row, ['Date']), rowNumber),
      time: normalizeBodyTime(csvColumns.read(row, ['Body Time']), rowNumber),
      value: parseCsvNumber(valueText, 'measurement value', rowNumber),
      comment: nullableText(csvColumns.read(row, ['Comment'])),
    })
  }

  function addLegacyBodyWeight(row, csvColumns, rowNumber) {
    const bodyWeightText = csvColumns.read(row, ['Body Weight'])
    const bodyFatText = csvColumns.read(row, ['Body Fat'])
    if (!bodyWeightText && !bodyFatText && !csvColumns.read(row, ['Comment'])) return

    bodyWeights.push({
      id: parseCsvId(csvColumns.read(row, ['Record ID']), `csv-body-weight-${bodyWeights.length + 1}`),
      date: parseCsvDate(csvColumns.read(row, ['Date']), rowNumber),
      time: normalizeBodyTime(csvColumns.read(row, ['Body Time']), rowNumber),
      bodyWeightMetric: bodyWeightText ? parseCsvNumber(bodyWeightText, 'body weight', rowNumber) : null,
      bodyFat: bodyFatText ? parseCsvNumber(bodyFatText, 'body fat', rowNumber) : null,
      comments: nullableText(csvColumns.read(row, ['Comment'])),
    })
  }
}

function normalizeRecordType(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function parseCsvId(value, fallback) {
  const text = String(value ?? '').trim()
  if (!text) return fallback
  if (/^\d+$/.test(text)) {
    const number = Number(text)
    if (Number.isSafeInteger(number)) return number
  }
  return text
}

function idKey(value) {
  return typeof value + ':' + String(value)
}

function parseWholeNumber(value, fallback, label, rowNumber) {
  const text = String(value ?? '').trim()
  if (!text) return fallback
  const number = Number(text)
  if (!Number.isInteger(number) || number < 0) {
    throw new Error('CSV row ' + rowNumber + ' has an invalid ' + label + '.')
  }
  return number
}

function normalizeBodyTime(value, rowNumber) {
  const text = String(value ?? '').trim()
  if (!text) return '00:00:00'
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(text)
  if (!match) throw new Error('CSV row ' + rowNumber + ' has an invalid body time.')
  return match[1] + ':' + match[2] + ':' + (match[3] ?? '00')
}

function nullableText(value) {
  const text = String(value ?? '')
  return text === '' ? null : text
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

  function finish(file, allowEmptyWorkoutSets = false) {
    if (!workoutSets.length && !allowEmptyWorkoutSets) throw new Error('The CSV does not contain any workout sets.')
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
