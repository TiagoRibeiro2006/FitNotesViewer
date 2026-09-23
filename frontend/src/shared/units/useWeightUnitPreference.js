import { readonly, ref } from 'vue'
import {
  displayMeasurementUnit,
  displayMeasurementValue,
  displayWeight,
  KILOGRAMS,
  normalizeWeightUnit,
  POUNDS,
  storeMeasurementValue,
  storeWeight,
} from './weightUnits.js'

const STORAGE_KEY = 'fitnotes-viewer-weight-unit'
const weightUnit = ref(readSavedUnit())

export function useWeightUnitPreference() {
  return {
    weightUnit: readonly(weightUnit),
    displayMeasurementUnit: readMeasurementUnit,
    displayMeasurementValue: readMeasurementValue,
    displayWeight: readDisplayWeight,
    setWeightUnit,
    storeMeasurementValue: readStoredMeasurementValue,
    storeWeight: readStoredWeight,
  }
}

function readMeasurementValue(value, sourceUnit) {
  return displayMeasurementValue(value, sourceUnit, weightUnit.value)
}

function readMeasurementUnit(sourceUnit) {
  return displayMeasurementUnit(sourceUnit, weightUnit.value)
}

function readStoredMeasurementValue(value, storageUnit) {
  return storeMeasurementValue(value, storageUnit, weightUnit.value)
}

function readDisplayWeight(valueInKilograms) {
  return displayWeight(valueInKilograms, weightUnit.value)
}

function readStoredWeight(value) {
  return storeWeight(value, weightUnit.value)
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
