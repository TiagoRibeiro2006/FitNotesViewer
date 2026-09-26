const DEFAULT_MUSCLE_NAME = 'Other'

export function readWorkouts(workouts) {
  if (!Array.isArray(workouts)) return []
  return workouts
}

export function readExercises(workout) {
  if (!Array.isArray(workout?.exercises)) return []
  return workout.exercises
}

export function readSets(exercise) {
  if (!Array.isArray(exercise?.sets)) return []
  return exercise.sets
}

export function readExerciseName(exercise) {
  const name = String(exercise?.name ?? '').trim()
  return name || 'Unknown exercise'
}

export function readMuscleName(exercise) {
  const muscle = exercise?.muscle
  if (typeof muscle === 'string') return normalizeMuscleName(muscle)
  if (muscle?.name) return normalizeMuscleName(muscle.name)
  if (exercise?.muscleName) return normalizeMuscleName(exercise.muscleName)
  if (exercise?.categoryName) return normalizeMuscleName(exercise.categoryName)
  if (exercise?.category?.name) return normalizeMuscleName(exercise.category.name)
  return DEFAULT_MUSCLE_NAME
}

function normalizeMuscleName(value) {
  const name = String(value ?? '').trim()
  return name || DEFAULT_MUSCLE_NAME
}
