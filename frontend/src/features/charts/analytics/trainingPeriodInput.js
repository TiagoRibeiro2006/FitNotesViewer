import { dateToKey, normalizeDateKey, shiftDateKey } from '../../../shared/utils/dates.js'

export function buildTrainingPeriodWorkouts(sets, startDate, endDate) {
  const period = normalizeTrainingPeriod(startDate, endDate)
  if (!period) return []

  const workouts = new Map()

  for (const set of sets ?? []) {
    const date = normalizeDateKey(set?.date)
    if (!date || date < period.startDate || date > period.endDate) continue
    addSetToWorkout(workouts, date, set)
  }

  return finalizeWorkouts(workouts)
}

export function createDefaultTrainingPeriod(sets) {
  const latestDate = findLatestWorkoutDate(sets)
  if (!latestDate) return null

  const startDate = startOfWeek(latestDate)
  return { startDate, endDate: shiftDateKey(startDate, 6) }
}

export function normalizeTrainingPeriod(startDate, endDate) {
  const normalizedStart = normalizeDateKey(startDate)
  const normalizedEnd = normalizeDateKey(endDate)
  if (!normalizedStart || !normalizedEnd || normalizedStart > normalizedEnd) return null
  return { startDate: normalizedStart, endDate: normalizedEnd }
}

export function countTrainingPeriodDays(startDate, endDate) {
  const period = normalizeTrainingPeriod(startDate, endDate)
  if (!period) return 0

  const start = createDate(period.startDate)
  const end = createDate(period.endDate)
  return Math.round((end - start) / 86400000) + 1
}

function findLatestWorkoutDate(sets) {
  let latestDate = null

  for (const set of sets ?? []) {
    const date = normalizeDateKey(set?.date)
    if (date && (!latestDate || date > latestDate)) latestDate = date
  }

  return latestDate
}

function startOfWeek(dateKey) {
  const date = createDate(dateKey)
  const daysSinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysSinceMonday)
  return dateToKey(date)
}

function createDate(dateKey) {
  const parts = dateKey.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
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
