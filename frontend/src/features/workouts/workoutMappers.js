export function groupWorkoutSetsByExercise(sets) {
  const exercises = new Map()

  for (const set of sets) {
    if (!exercises.has(set.exerciseId)) {
      exercises.set(set.exerciseId, {
        id: set.exerciseId,
        name: set.exerciseName,
        sets: [],
      })
    }

    exercises.get(set.exerciseId).sets.push({
      id: set.id,
      weight: set.weight,
      reps: set.reps,
    })
  }

  return [...exercises.values()]
}
