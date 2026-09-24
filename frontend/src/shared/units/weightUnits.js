export const KILOGRAMS = 'kg'
export const POUNDS = 'lb'

const POUNDS_PER_KILOGRAM = 2.2046226218487757
const STORAGE_DECIMALS = 6

export function normalizeWeightUnit(unit) {
  const value = String(unit ?? '').trim().toLowerCase()
  if (value === 'lb' || value === 'lbs' || value === 'pound' || value === 'pounds') {
    return POUNDS
  }
  return KILOGRAMS
}

export function convertWeight(value, sourceUnit, targetUnit) {
  const weight = readWeight(value)
  if (weight === null) return null

  const source = normalizeWeightUnit(sourceUnit)
  const target = normalizeWeightUnit(targetUnit)
  if (source === target) return weight
  if (source === KILOGRAMS) return weight * POUNDS_PER_KILOGRAM
  return weight / POUNDS_PER_KILOGRAM
}

export function displayWeight(valueInKilograms, displayUnit) {
  return convertWeight(valueInKilograms, KILOGRAMS, displayUnit)
}

export function storeWeight(value, inputUnit) {
  const kilograms = convertWeight(value, inputUnit, KILOGRAMS)
  return kilograms === null ? null : roundForStorage(kilograms)
}

export function displayMeasurementValue(value, sourceUnit, displayUnit) {
  if (!isWeightUnit(sourceUnit)) return readWeight(value)
  return convertWeight(value, sourceUnit, displayUnit)
}

export function displayMeasurementUnit(sourceUnit, displayUnit) {
  if (!isWeightUnit(sourceUnit)) return String(sourceUnit ?? '')
  return normalizeWeightUnit(displayUnit)
}

export function storeMeasurementValue(value, storageUnit, inputUnit) {
  if (!isWeightUnit(storageUnit)) return readWeight(value)
  const storedValue = convertWeight(value, inputUnit, storageUnit)
  return storedValue === null ? null : roundForStorage(storedValue)
}

export function isWeightUnit(unit) {
  const value = String(unit ?? '').trim().toLowerCase()
  return value === 'kg'
    || value === 'kgs'
    || value === 'kilogram'
    || value === 'kilograms'
    || value === 'lb'
    || value === 'lbs'
    || value === 'pound'
    || value === 'pounds'
}

function readWeight(value) {
  if (value === '' || value === null || value === undefined) return null
  const weight = Number(String(value).replace(',', '.'))
  return Number.isFinite(weight) ? weight : null
}

function roundForStorage(value) {
  const scale = 10 ** STORAGE_DECIMALS
  return Math.round(value * scale) / scale
}
