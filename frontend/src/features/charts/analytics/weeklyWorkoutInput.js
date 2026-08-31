import { dateToKey, normalizeDateKey, shiftDateKey } from '../../../shared/utils/dates.js'

export function buildLatestWeeklyWorkouts(sets) {
  const latestDate = findLatestDate(sets)
  if (!latestDate) return []

  const startDate = startOfWeek(latestDate)
  const endDate = shiftDateKey(startDate, 6)
  const workouts = new Map()

  for (const set of sets ?? []) {
    const date = normalizeDateKey(set?.date)
    if (!date || date < startDate || date > endDate) continue
    addSetToWorkout(workouts, date, set)
  }

  return finalizeWorkouts(workouts)
}

function findLatestDate(sets) {
  let latestDate = null

  for (const set of sets ?? []) {
    const date = normalizeDateKey(set?.date)
    if (date && (!latestDate || date > latestDate)) latestDate = date
  }

  return latestDate
}

function startOfWeek(dateKey) {
  const parts = dateKey.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  const daysSinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysSinceMonday)
  return dateToKey(date)
}

function addSetToWorkout(workouts, date, set) {
  const workout = workouts.get(date) ?? createWorkout(date)
  const exerciseKey = String(set.exerciseId ?? set.exerciseName ?? 'unknown')
  const exercise = workout.exercises.get(exerciseKey) ?? createExercise(set)

  exercise.sets.push({ weight: set.weight, reps: set.reps })
  workout.exercises.set(exerciseKey, exercise)
  workouts.set(date, workout)
}

function createWorkout(date) {
  return { date, exercises: new Map() }
}

function createExercise(set) {
  return {
    name: String(set.exerciseName ?? 'Unknown exercise'),
    muscle: String(set.muscleName ?? 'Other'),
    sets: [],
  }
}

function finalizeWorkouts(workoutMap) {
  const workouts = []

  for (const workout of workoutMap.values()) {
    workouts.push({
      date: workout.date,
      exercises: [...workout.exercises.values()],
    })
  }

  workouts.sort(compareWorkoutDates)
  return workouts
}

function compareWorkoutDates(first, second) {
  return first.date.localeCompare(second.date)
}
