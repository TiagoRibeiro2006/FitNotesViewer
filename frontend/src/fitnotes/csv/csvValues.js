const POUNDS_TO_KILOGRAMS = 0.45359237
const DISTANCE_TO_KILOMETRES = new Map([
  ['', 1], ['km', 1], ['kms', 1], ['kilometer', 1], ['kilometers', 1], ['kilometre', 1], ['kilometres', 1],
  ['mi', 1.609344], ['mile', 1.609344], ['miles', 1.609344],
  ['m', 0.001], ['meter', 0.001], ['meters', 0.001], ['metre', 0.001], ['metres', 0.001],
  ['yd', 0.0009144], ['yard', 0.0009144], ['yards', 0.0009144],
])

export function readMetricDistance(row, columns, rowNumber) {
  const distance = parseCsvNumber(columns.read(row, ['Distance']), 'distance', rowNumber)
  if (distance === 0) return 0
  const unit = columns.read(row, ['Distance Unit']).toLowerCase()
  const factor = DISTANCE_TO_KILOMETRES.get(unit)
  if (factor === undefined) throw new Error('CSV row ' + rowNumber + ' has an unsupported distance unit: ' + unit + '.')
  return Math.round(distance * factor * 1e9) / 1e9
}

export function parseCsvDate(value, rowNumber) {
  const text = String(value ?? '').trim()
  const iso = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) return buildDateKey(iso[1], iso[2], iso[3], rowNumber)

  const localized = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
  if (localized) return parseLocalizedDate(localized, rowNumber)

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return buildDateKey(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate(), rowNumber)
  }
  throw new Error('CSV row ' + rowNumber + ' has an invalid date.')
}

export function parseCsvNumber(value, label, rowNumber, fallback = 0) {
  const text = String(value ?? '').trim()
  if (!text) return fallback

  const normalized = text.replace(/\s/g, '').replace(',', '.')
  const number = Number(normalized)
  if (!Number.isFinite(number) || number < 0) {
    throw new Error('CSV row ' + rowNumber + ' has an invalid ' + label + '.')
  }
  return number
}

export function readMetricWeight(row, columns, rowNumber) {
  const kilograms = columns.read(row, [
    'Weight (kg)',
    'Weight (kgs)',
    'Weight (kilograms)',
    'Weight kg',
    'Weight kgs',
  ])
  if (kilograms) return parseCsvNumber(kilograms, 'weight', rowNumber)

  const pounds = columns.read(row, ['Weight (lbs)', 'Weight (pounds)', 'Weight lbs', 'Weight lb'])
  if (pounds) return roundWeight(parseCsvNumber(pounds, 'weight', rowNumber) * POUNDS_TO_KILOGRAMS)

  const weight = parseCsvNumber(columns.read(row, ['Weight']), 'weight', rowNumber)
  const unit = columns.read(row, ['Weight Unit', 'Unit']).toLowerCase()
  return unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds'
    ? roundWeight(weight * POUNDS_TO_KILOGRAMS)
    : weight
}

export function parseDurationSeconds(value, rowNumber) {
  const text = String(value ?? '').trim()
  if (!text) return 0
  if (/^\d+$/.test(text)) return Number(text)

  const parts = text.split(':')
  if (parts.length !== 2 && parts.length !== 3) {
    throw new Error('CSV row ' + rowNumber + ' has an invalid time.')
  }

  const numbers = parts.map(Number)
  if (numbers.some(isInvalidTimePart)) {
    throw new Error('CSV row ' + rowNumber + ' has an invalid time.')
  }

  if (numbers.length === 2) return numbers[0] * 60 + numbers[1]
  return numbers[0] * 3600 + numbers[1] * 60 + numbers[2]
}

function buildDateKey(yearValue, monthValue, dayValue, rowNumber) {
  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error('CSV row ' + rowNumber + ' has an invalid date.')
  }
  return String(year).padStart(4, '0')
    + '-' + String(month).padStart(2, '0')
    + '-' + String(day).padStart(2, '0')
}

function parseLocalizedDate(match, rowNumber) {
  const first = Number(match[1])
  const second = Number(match[2])
  const year = match[3]

  if (second > 12 && first <= 12) {
    return buildDateKey(year, first, second, rowNumber)
  }
  return buildDateKey(year, second, first, rowNumber)
}

function isInvalidTimePart(value) {
  return !Number.isInteger(value) || value < 0
}

function roundWeight(value) {
  return Math.round(value * 10000) / 10000
}
