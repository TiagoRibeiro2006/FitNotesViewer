import { readExercises, readSets, readWorkouts } from '../utils/workoutData.js'

export function calculateWorkoutSets(workouts) {
  const workoutTotals = []
  let totalSets = 0

  for (const workout of readWorkouts(workouts)) {
    const workoutSetCount = countWorkoutSets(workout)
    totalSets += workoutSetCount
    workoutTotals.push({
      date: String(workout?.date ?? ''),
      totalSets: workoutSetCount,
    })
  }

  return { totalSets, workouts: workoutTotals }
}

function countWorkoutSets(workout) {
  let totalSets = 0

  for (const exercise of readExercises(workout)) {
    totalSets += readSets(exercise).length
  }

  return totalSets
}
