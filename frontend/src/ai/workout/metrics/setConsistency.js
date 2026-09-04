import {
  readExerciseName,
  readExercises,
  readMuscleName,
  readSets,
  readWorkouts,
} from '../utils/workoutData.js'

export function calculateSetConsistency(workouts) {
  const exerciseSetCounts = collectExerciseSetCounts(workouts)
  let weightedStability = 0
  let comparedSessions = 0
  let comparedExercises = 0

  for (const setCounts of exerciseSetCounts.values()) {
    if (setCounts.length < 2) continue

    const stability = calculateStability(setCounts)
    weightedStability += stability * setCounts.length
    comparedSessions += setCounts.length
    comparedExercises += 1
  }

  return {
    stability: comparedSessions ? weightedStability / comparedSessions : null,
    comparedExercises,
    comparedSessions,
  }
}

function collectExerciseSetCounts(workouts) {
  const exerciseSetCounts = new Map()

  for (const workout of readWorkouts(workouts)) {
    for (const exercise of readExercises(workout)) {
      const setCount = readSets(exercise).length
      if (!setCount) continue

      const key = readMuscleName(exercise) + '::' + readExerciseName(exercise)
      const counts = exerciseSetCounts.get(key) ?? []
      counts.push(setCount)
      exerciseSetCounts.set(key, counts)
    }
  }

  return exerciseSetCounts
}

function calculateStability(setCounts) {
  let minimum = setCounts[0]
  let maximum = setCounts[0]

  for (const setCount of setCounts) {
    minimum = Math.min(minimum, setCount)
    maximum = Math.max(maximum, setCount)
  }

  return maximum ? minimum / maximum : 0
}
