const COLUMNS = [
  'Date',
  'Exercise',
  'Category',
  'Weight',
  'Weight Unit',
  'Reps',
  'Distance',
  'Distance Unit',
  'Time',
]

export function createFitNotesCsvExport(data) {
  const exercises = createLookup(data.exercises)
  const categories = createLookup(data.categories)
  const workoutSets = [...data.workoutSets].sort(compareWorkoutSets)
  const lines = [createCsvLine(COLUMNS)]

  for (const set of workoutSets) {
    const exercise = exercises.get(set.exerciseId)
    const category = categories.get(exercise?.categoryId)
    lines.push(createCsvLine(createSetRow(set, exercise, category)))
  }

  return '\uFEFF' + lines.join('\r\n') + '\r\n'
}

function createLookup(items = []) {
  const lookup = new Map()
  for (const item of items) lookup.set(item.id, item)
  return lookup
}

function createSetRow(set, exercise, category) {
  const distance = readPositiveNumber(set.distance)
  const duration = readPositiveNumber(set.durationSeconds)

  return [
    String(set.date ?? ''),
    String(exercise?.name ?? set.exerciseName ?? ''),
    String(category?.name ?? 'Other'),
    readNumber(set.weight),
    'kgs',
    readNumber(set.reps),
    distance || '',
    distance ? 'km' : '',
    duration ? formatDuration(duration) : '',
  ]
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

function readPositiveNumber(value) {
  return Math.max(0, readNumber(value))
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

function readOrder(value) {
  const number = Number(value)
  return Number.isInteger(number) ? number : Number.MAX_SAFE_INTEGER
}
