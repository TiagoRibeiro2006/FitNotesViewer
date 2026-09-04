import {
  readExercises,
  readMuscleName,
  readSets,
  readWorkouts,
} from '../utils/workoutData.js'

export function calculateMuscleFrequency(workouts) {
  const frequencies = new Map()

  for (const workout of readWorkouts(workouts)) {
    const trainedMuscles = readTrainedMuscles(workout)
    addWorkoutFrequencies(frequencies, trainedMuscles)
  }

  return Object.fromEntries(frequencies)
}

function readTrainedMuscles(workout) {
  const muscles = new Set()

  for (const exercise of readExercises(workout)) {
    if (readSets(exercise).length) muscles.add(readMuscleName(exercise))
  }

  return muscles
}

function addWorkoutFrequencies(frequencies, muscles) {
  for (const muscleName of muscles) {
    const currentFrequency = frequencies.get(muscleName) ?? 0
    frequencies.set(muscleName, currentFrequency + 1)
  }
}
