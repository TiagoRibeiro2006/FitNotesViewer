import {
  convertWeight,
  KILOGRAMS,
  normalizeWeightUnit,
  POUNDS,
} from '../../shared/units/weightUnits.js'

const INPUT_DECIMALS = 3

export function nextRepMaxWeightUnit(currentUnit) {
  return normalizeWeightUnit(currentUnit) === KILOGRAMS ? POUNDS : KILOGRAMS
}

export function convertRepMaxWeightInput(value, sourceUnit, targetUnit) {
  if (String(value ?? '').trim() === '') return ''

  const converted = convertWeight(value, sourceUnit, targetUnit)
  if (converted === null) return value
  return String(roundInputValue(converted))
}

function roundInputValue(value) {
  const scale = 10 ** INPUT_DECIMALS
  return Math.round(value * scale) / scale
}
