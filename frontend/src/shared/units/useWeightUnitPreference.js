import { readonly, ref } from 'vue'
import { KILOGRAMS, normalizeWeightUnit, POUNDS } from './weightUnits.js'

const STORAGE_KEY = 'fitnotes-viewer-weight-unit'
const weightUnit = ref(readSavedUnit())

export function useWeightUnitPreference() {
  return {
    weightUnit: readonly(weightUnit),
    setWeightUnit,
  }
}

function setWeightUnit(unit) {
  const normalized = normalizeWeightUnit(unit)
  weightUnit.value = normalized
  saveUnit(normalized)
}

function readSavedUnit() {
  if (!canUseLocalStorage()) return KILOGRAMS
  return normalizeWeightUnit(localStorage.getItem(STORAGE_KEY))
}

function saveUnit(unit) {
  if (!canUseLocalStorage()) return
  localStorage.setItem(STORAGE_KEY, unit)
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}

export const WEIGHT_UNIT_OPTIONS = [
  { id: KILOGRAMS, label: 'Kilograms', symbol: 'kg' },
  { id: POUNDS, label: 'Pounds', symbol: 'lb' },
]
