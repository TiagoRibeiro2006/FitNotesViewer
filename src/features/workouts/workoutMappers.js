export function groupWorkoutSetsByExercise(sets, catalogExercises = []) {
  const exercises = new Map()
  const catalog = new Map()
  for (const exercise of catalogExercises) catalog.set(exercise.id, exercise)

  for (const set of sets) {
    if (!exercises.has(set.exerciseId)) {
      exercises.set(set.exerciseId, {
        id: set.exerciseId,
        name: set.exerciseName,
        categoryName: catalog.get(set.exerciseId)?.categoryName ?? '',
        categoryColor: catalog.get(set.exerciseId)?.categoryColor ?? null,
        categoryIcon: catalog.get(set.exerciseId)?.categoryIcon,
        sets: [],
      })
    }

    exercises.get(set.exerciseId).sets.push({
      id: set.id,
      isProgress: set.isProgress,
      weight: set.weight,
      reps: set.reps,
    })
  }

  return [...exercises.values()]
}
