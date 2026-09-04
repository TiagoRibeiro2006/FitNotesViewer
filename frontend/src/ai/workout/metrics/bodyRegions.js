import {
  readExercises,
  readMuscleName,
  readSets,
  readWorkouts,
} from '../utils/workoutData.js'

const UPPER_BODY_NAMES = [
  'arm',
  'back',
  'bicep',
  'chest',
  'delt',
  'lat',
  'pec',
  'pull',
  'push',
  'rhomboid',
  'shoulder',
  'trap',
  'tricep',
]

const LOWER_BODY_NAMES = [
  'adductor',
  'abductor',
  'glute',
  'hamstring',
  'hip',
  'leg',
  'quad',
  'thigh',
]

const ACCESSORY_NAMES = [
  'abdominal',
  'abs',
  'calf',
  'core',
  'forearm',
]

export function calculateBodyRegions(workouts) {
  const regions = {
    upper: createRegionMetrics(),
    lower: createRegionMetrics(),
  }

  for (const workout of readWorkouts(workouts)) {
    addWorkoutToRegions(regions, workout)
  }

  return regions
}

function addWorkoutToRegions(regions, workout) {
  const trainedRegions = new Set()

  for (const exercise of readExercises(workout)) {
    const setCount = readSets(exercise).length
    if (!setCount) continue

    const regionName = findBodyRegion(readMuscleName(exercise))
    if (!regionName) continue
    regions[regionName].totalSets += setCount
    trainedRegions.add(regionName)
  }

  for (const regionName of trainedRegions) {
    regions[regionName].frequency += 1
  }
}

function findBodyRegion(muscleName) {
  const normalizedName = normalizeName(muscleName)
  if (matchesAnyName(normalizedName, ACCESSORY_NAMES)) return null
  if (matchesAnyName(normalizedName, LOWER_BODY_NAMES)) return 'lower'
  if (matchesAnyName(normalizedName, UPPER_BODY_NAMES)) return 'upper'
  return null
}

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function matchesAnyName(name, candidates) {
  for (const candidate of candidates) {
    if (name.includes(candidate)) return true
  }
  return false
}

function createRegionMetrics() {
  return { frequency: 0, totalSets: 0 }
}
