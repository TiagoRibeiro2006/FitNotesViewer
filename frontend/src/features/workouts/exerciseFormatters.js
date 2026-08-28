import { relativeDate } from '../../shared/utils/dates'

export function exerciseMeta(exercise) {
  const workouts = `${exercise.workoutCount} ${exercise.workoutCount === 1 ? 'workout' : 'workouts'}`
  if (!exercise.lastWorkoutDate) return workouts
  return `${workouts} · ${relativeDate(exercise.lastWorkoutDate)}`
}
