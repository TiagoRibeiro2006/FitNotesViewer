const COLUMNS = [
  'Record Type',
  'Record ID',
  'Date',
  'Exercise',
  'Category',
  'Weight',
  'Weight Unit',
  'Reps',
  'Distance',
  'Distance Unit',
  'Time',
  'Body Time',
  'Measurement ID',
  'Measurement',
  'Measurement Unit ID',
  'Measurement Unit',
  'Measurement Unit Long Name',
  'Measurement Unit Type',
  'Measurement Goal Type',
  'Measurement Goal Value',
  'Measurement Custom',
  'Measurement Enabled',
  'Measurement Sort Order',
  'Measurement Value',
  'Body Weight',
  'Body Fat',
  'Comment',
  'Local Body ID',
]

export function createFitNotesCsvExport(data) {
  const exercises = createLookup(data.exercises)
  const categories = createLookup(data.categories)
  const units = createLookup(data.measurementUnits)
  const measurements = createLookup(data.measurements)
  const lines = [createCsvLine(COLUMNS)]

  for (const unit of sortById(data.measurementUnits)) {
    lines.push(createCsvLine(createBodyUnitRow(unit)))
  }

  for (const measurement of sortMeasurements(data.measurements)) {
    lines.push(createCsvLine(createBodyDefinitionRow(measurement, units.get(measurement.unitId))))
  }

  for (const record of sortBodyRecords(data.measurementRecords)) {
    const measurement = measurements.get(record.measurementId)
    const unit = units.get(measurement?.unitId)
    lines.push(createCsvLine(createBodyMeasurementRow(record, measurement, unit)))
  }

  for (const row of sortBodyRecords(data.bodyWeights)) {
    lines.push(createCsvLine(createLegacyBodyWeightRow(row)))
  }

  const workoutSets = [...(data.workoutSets ?? [])].sort(compareWorkoutSets)
  for (const set of workoutSets) {
    const exercise = exercises.get(set.exerciseId)
    const category = categories.get(exercise?.categoryId)
    lines.push(createCsvLine(createSetRow(set, exercise, category)))
  }

  return '\uFEFF' + lines.join('\r\n') + '\r\n'
}

function emptyRow() {
  return Array(COLUMNS.length).fill('')
}

function createSetRow(set, exercise, category) {
  const row = emptyRow()
  const distance = readPositiveNumber(set.distance)
  const duration = readPositiveNumber(set.durationSeconds)
  setValue(row, 'Record Type', 'Workout')
  setValue(row, 'Date', String(set.date ?? ''))
  setValue(row, 'Exercise', String(exercise?.name ?? set.exerciseName ?? ''))
  setValue(row, 'Category', String(category?.name ?? 'Other'))
  setValue(row, 'Weight', readNumber(set.weight))
  setValue(row, 'Weight Unit', 'kgs')
  setValue(row, 'Reps', readNumber(set.reps))
  setValue(row, 'Distance', distance || '')
  setValue(row, 'Distance Unit', distance ? 'km' : '')
  setValue(row, 'Time', duration ? formatDuration(duration) : '')
  return row
}

function createBodyUnitRow(unit) {
  const row = emptyRow()
  setValue(row, 'Record Type', 'Body Unit')
  setValue(row, 'Measurement Unit ID', serializeId(unit.id))
  setValue(row, 'Measurement Unit', String(unit.shortName ?? ''))
  setValue(row, 'Measurement Unit Long Name', String(unit.longName ?? ''))
  setValue(row, 'Measurement Unit Type', readNumber(unit.type))
  return row
}

function createBodyDefinitionRow(measurement, unit) {
  const row = emptyRow()
  setValue(row, 'Record Type', 'Body Definition')
  setValue(row, 'Measurement ID', serializeId(measurement.id))
  setValue(row, 'Measurement', String(measurement.name ?? ''))
  setValue(row, 'Measurement Unit ID', serializeId(measurement.unitId))
  setValue(row, 'Measurement Unit', String(unit?.shortName ?? ''))
  setValue(row, 'Measurement Unit Long Name', String(unit?.longName ?? ''))
  setValue(row, 'Measurement Unit Type', readNumber(unit?.type))
  setValue(row, 'Measurement Goal Type', readNumber(measurement.goalType))
  setValue(row, 'Measurement Goal Value', readNumber(measurement.goalValue))
  setValue(row, 'Measurement Custom', readNumber(measurement.custom))
  setValue(row, 'Measurement Enabled', measurement.enabled === undefined ? 1 : readNumber(measurement.enabled))
  setValue(row, 'Measurement Sort Order', readNumber(measurement.sortOrder))
  setValue(row, 'Local Body ID', String(measurement.localBodyId ?? ''))
  return row
}

function createBodyMeasurementRow(record, measurement, unit) {
  const row = emptyRow()
  setValue(row, 'Record Type', 'Body Measurement')
  setValue(row, 'Record ID', serializeId(record.id))
  setValue(row, 'Date', String(record.date ?? ''))
  setValue(row, 'Body Time', String(record.time ?? ''))
  setValue(row, 'Measurement ID', serializeId(record.measurementId))
  setValue(row, 'Measurement', String(measurement?.name ?? ''))
  setValue(row, 'Measurement Unit ID', serializeId(measurement?.unitId))
  setValue(row, 'Measurement Unit', String(unit?.shortName ?? ''))
  setValue(row, 'Measurement Value', readNumber(record.value))
  setValue(row, 'Comment', String(record.comment ?? ''))
  setValue(row, 'Local Body ID', String(measurement?.localBodyId ?? ''))
  return row
}

function createLegacyBodyWeightRow(record) {
  const row = emptyRow()
  setValue(row, 'Record Type', 'Legacy Body Weight')
  setValue(row, 'Record ID', serializeId(record.id))
  setValue(row, 'Date', String(record.date ?? ''))
  setValue(row, 'Body Time', String(record.time ?? ''))
  setValue(row, 'Body Weight', optionalNumber(record.bodyWeightMetric))
  setValue(row, 'Body Fat', optionalNumber(record.bodyFat))
  setValue(row, 'Comment', String(record.comments ?? ''))
  return row
}

function setValue(row, columnName, value) {
  row[COLUMNS.indexOf(columnName)] = value
}

function createLookup(items = []) {
  const lookup = new Map()
  for (const item of items ?? []) lookup.set(item.id, item)
  return lookup
}

function createCsvLine(values) {
  const escaped = []
  for (const value of values) escaped.push(escapeCsvValue(value))
  return escaped.join(',')
}

function escapeCsvValue(value) {
  const text = String(value ?? '')
  if (!/[",\r\n]/.test(text)) return text
  return '"' + text.replace(/"/g, '""') + '"'
}

function formatDuration(seconds) {
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainingSeconds = total % 60
  return padNumber(hours) + ':' + padNumber(minutes) + ':' + padNumber(remainingSeconds)
}

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function readNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return ''
  const number = Number(value)
  return Number.isFinite(number) ? number : ''
}

function readPositiveNumber(value) {
  return Math.max(0, readNumber(value))
}

function serializeId(value) {
  return value === null || value === undefined ? '' : String(value)
}

function compareWorkoutSets(first, second) {
  const dateComparison = String(first.date ?? '').localeCompare(String(second.date ?? ''))
  if (dateComparison !== 0) return dateComparison

  const exerciseComparison = readOrder(first.dayExerciseOrder) - readOrder(second.dayExerciseOrder)
  if (exerciseComparison !== 0) return exerciseComparison

  const setComparison = readOrder(first.localSetOrder) - readOrder(second.localSetOrder)
  if (setComparison !== 0) return setComparison
  return String(first.id ?? '').localeCompare(String(second.id ?? ''))
}

function sortById(items = []) {
  return [...(items ?? [])].sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? ''), undefined, { numeric: true }))
}

function sortMeasurements(items = []) {
  return [...(items ?? [])].sort((a, b) => {
    const order = readOrder(a.sortOrder) - readOrder(b.sortOrder)
    return order || String(a.id ?? '').localeCompare(String(b.id ?? ''), undefined, { numeric: true })
  })
}

function sortBodyRecords(items = []) {
  return [...(items ?? [])].sort((a, b) => {
    const date = String(a.date ?? '').localeCompare(String(b.date ?? ''))
    if (date) return date
    const time = String(a.time ?? '').localeCompare(String(b.time ?? ''))
    if (time) return time
    return String(a.id ?? '').localeCompare(String(b.id ?? ''), undefined, { numeric: true })
  })
}

function readOrder(value) {
  const number = Number(value)
  return Number.isInteger(number) ? number : Number.MAX_SAFE_INTEGER
}
