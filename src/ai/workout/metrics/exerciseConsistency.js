import {
  readExerciseName,
  readExercises,
  readMuscleName,
  readSets,
  readWorkouts,
} from '../utils/workoutData.js'

export function calculateExerciseConsistency(workouts) {
  const muscles = collectMuscleSessions(workouts)
  let repeatedOccurrences = 0
  let totalOccurrences = 0
  let comparedMuscles = 0

  for (const muscle of muscles.values()) {
    if (muscle.sessions.size < 2) continue
    comparedMuscles += 1

    for (const sessions of muscle.exerciseSessions.values()) {
      const occurrences = sessions.size
      totalOccurrences += occurrences
      if (occurrences > 1) repeatedOccurrences += occurrences
    }
  }

  return {
    repeatRate: totalOccurrences ? repeatedOccurrences / totalOccurrences : null,
    comparedMuscles,
    totalOccurrences,
  }
}

function collectMuscleSessions(workouts) {
  const muscles = new Map()
  const trainingDays = readWorkouts(workouts)

  for (let index = 0; index < trainingDays.length; index += 1) {
    addWorkout(muscles, trainingDays[index], index)
  }

  return muscles
}

function addWorkout(muscles, workout, workoutIndex) {
  const sessionKey = readSessionKey(workout, workoutIndex)

  for (const exercise of readExercises(workout)) {
    if (!readSets(exercise).length) continue

    const muscleName = readMuscleName(exercise)
    const exerciseName = readExerciseName(exercise)
    const muscle = muscles.get(muscleName) ?? createMuscle()
    const exerciseSessions = muscle.exerciseSessions.get(exerciseName) ?? new Set()

    muscle.sessions.add(sessionKey)
    exerciseSessions.add(sessionKey)
    muscle.exerciseSessions.set(exerciseName, exerciseSessions)
    muscles.set(muscleName, muscle)
  }
}

function readSessionKey(workout, workoutIndex) {
  const date = String(workout?.date ?? '').trim()
  return date || 'workout-' + workoutIndex
}

function createMuscle() {
  return {
    sessions: new Set(),
    exerciseSessions: new Map(),
  }
}
