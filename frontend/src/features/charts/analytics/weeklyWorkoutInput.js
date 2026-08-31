import { dateToKey, normalizeDateKey, shiftDateKey } from '../../../shared/utils/dates.js'

export function buildLatestWeeklyWorkouts(sets) {
  const latestDate = findLatestWorkoutDate(sets)
  if (!latestDate) return []

  return buildWeeklyWorkouts(sets, latestDate)
}

export function buildWeeklyWorkouts(sets, referenceDate) {
  const range = readWorkoutWeekRange(referenceDate)
  if (!range) return []

  const workouts = new Map()

  for (const set of sets ?? []) {
    const date = normalizeDateKey(set?.date)
    if (!date || date < range.startDate || date > range.endDate) continue
    addSetToWorkout(workouts, date, set)
  }

  return finalizeWorkouts(workouts)
}

export function findLatestWorkoutDate(sets) {
  let latestDate = null

  for (const set of sets ?? []) {
    const date = normalizeDateKey(set?.date)
    if (date && (!latestDate || date > latestDate)) latestDate = date
  }

  return latestDate
}

export function readWorkoutWeekRange(referenceDate) {
  const date = normalizeDateKey(referenceDate)
  if (!date) return null

  const startDate = startOfWeek(date)
  return { startDate, endDate: shiftDateKey(startDate, 6) }
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
