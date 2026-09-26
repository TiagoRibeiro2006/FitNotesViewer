import {
  readExercises,
  readMuscleName,
  readSets,
  readWorkouts,
} from '../utils/workoutData.js'

export function calculateMuscleSets(workouts) {
  const totals = new Map()

  for (const workout of readWorkouts(workouts)) {
    addWorkoutSets(totals, workout)
  }

  return Object.fromEntries(totals)
}

function addWorkoutSets(totals, workout) {
  for (const exercise of readExercises(workout)) {
    const setCount = readSets(exercise).length
    if (!setCount) continue

    const muscleName = readMuscleName(exercise)
    const currentTotal = totals.get(muscleName) ?? 0
    totals.set(muscleName, currentTotal + setCount)
  }
}
