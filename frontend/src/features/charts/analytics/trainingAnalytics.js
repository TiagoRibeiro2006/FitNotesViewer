import { androidColorToCss } from '../../../shared/utils/colors.js'
import { normalizeDateKey } from '../../../shared/utils/dates.js'
import { buildHistoricalProgress } from '../../../shared/utils/exerciseProgress.js'
import { differenceInDays, filterByDateRange, rangeDayCount } from './dateRanges.js'

export function createTrainingAnalytics(data, rangeId, muscleId = 'all') {
  const allSets = normalizeSets(data.workoutSets)
  const progressById = buildHistoricalProgress(allSets)
  const sets = filterByDateRange(allSets, rangeId)
  const lookups = createLookups(data.exercises, data.categories)
  const enrichedSets = filterByMuscle(enrichSets(sets, lookups, progressById), muscleId)
  const workoutDays = uniqueValues(enrichedSets, 'date')
  const activeExercises = uniqueValues(enrichedSets, 'exerciseId')
  const totalVolume = sumValues(enrichedSets, 'volume')
  const totalReps = sumValues(enrichedSets, 'reps')
  const progressSets = countProgressSets(enrichedSets)
  const daysInRange = rangeDayCount(rangeId, enrichedSets)
  const weeksInRange = daysInRange ? Math.max(1, daysInRange / 7) : 0
  const muscleDistribution = buildMuscleDistribution(enrichedSets, weeksInRange)

  return {
    sets: enrichedSets,
    totalSets: enrichedSets.length,
    totalVolume,
    totalReps,
    progressSets,
    workoutCount: workoutDays.size,
    exerciseCount: activeExercises.size,
    averageSetsPerWorkout: workoutDays.size ? enrichedSets.length / workoutDays.size : 0,
    workoutsPerWeek: weeksInRange ? workoutDays.size / weeksInRange : 0,
    longestStreak: calculateLongestStreak(workoutDays),
    muscleDistribution,
    exerciseRanking: buildExerciseRanking(enrichedSets),
    weekdayDistribution: buildWeekdayDistribution(enrichedSets),
  }
}

function filterByMuscle(sets, muscleId) {
  if (muscleId === 'all') return sets

  const filtered = []
  for (const set of sets) {
    if (String(set.muscleId) === String(muscleId)) filtered.push(set)
  }
  return filtered
}

function normalizeSets(rows) {
  const sets = []

  for (const row of rows ?? []) {
    const weight = Number(row.weight)
    const reps = Number(row.reps)
    const date = normalizeDateKey(row.date)
    if (!date || !Number.isFinite(weight) || !Number.isFinite(reps) || reps < 1) continue
    sets.push({ ...row, date, weight, reps })
  }

  return sets
}

function createLookups(exercises, categories) {
  const exerciseById = new Map()
  const categoryById = new Map()
  for (const exercise of exercises ?? []) exerciseById.set(String(exercise.id), exercise)
  for (const category of categories ?? []) categoryById.set(String(category.id), category)
  return { exerciseById, categoryById }
}

function enrichSets(sets, lookups, progressById) {
  const enriched = []

  for (const set of sets) {
    const exercise = lookups.exerciseById.get(String(set.exerciseId))
    const category = lookups.categoryById.get(String(exercise?.categoryId))
    enriched.push({
      ...set,
      exerciseName: String(exercise?.name ?? set.exerciseName ?? 'Unknown exercise'),
      muscleId: category?.id ?? 'unknown',
      muscleName: String(category?.name ?? 'Other'),
      muscleColor: androidColorToCss(category?.colour),
      volume: set.weight * set.reps,
      isProgress: progressById.get(set.id) === true,
    })
  }

  return enriched
}

function buildMuscleDistribution(sets, weeksInRange) {
  const muscles = new Map()

  for (const set of sets) {
    const key = String(set.muscleId)
    const muscle = muscles.get(key) ?? createMuscleSummary(set)
    muscle.sets += 1
    muscle.reps += set.reps
    muscle.volume += set.volume
    muscle.dates.add(set.date)
    muscle.exercises.add(String(set.exerciseId))
    muscles.set(key, muscle)
  }

  const distribution = []
  for (const muscle of muscles.values()) {
    distribution.push({
      ...muscle,
      sessions: muscle.dates.size,
      sessionsPerWeek: weeksInRange ? muscle.dates.size / weeksInRange : 0,
      exerciseCount: muscle.exercises.size,
    })
  }
  distribution.sort(compareSetCount)
  return distribution
}

function buildWeekdayDistribution(sets) {
  const weekdays = createWeekdays()

  for (const set of sets) {
    const index = readWeekdayIndex(set.date)
    const day = weekdays[index]
    day.sets += 1
    day.volume += set.volume
    day.dates.add(set.date)
  }

  return weekdays.map(finalizeWeekday)
}

function createWeekdays() {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return labels.map(createWeekday)
}

function createWeekday(label, index) {
  return { id: index, label, sets: 0, volume: 0, dates: new Set() }
}

function finalizeWeekday(day) {
  return { ...day, workouts: day.dates.size }
}

function readWeekdayIndex(dateKey) {
  const parts = dateKey.split('-').map(Number)
  return (new Date(parts[0], parts[1] - 1, parts[2]).getDay() + 6) % 7
}

function createMuscleSummary(set) {
  return {
    id: set.muscleId,
    name: set.muscleName,
    color: set.muscleColor,
    sets: 0,
    reps: 0,
    volume: 0,
    dates: new Set(),
    exercises: new Set(),
  }
}

function buildExerciseRanking(sets) {
  const exercises = new Map()

  for (const set of sets) {
    const key = String(set.exerciseId)
    const exercise = exercises.get(key) ?? createExerciseSummary(set)
    exercise.sets += 1
    exercise.reps += set.reps
    exercise.volume += set.volume
    exercise.dates.add(set.date)
    if (set.isProgress) exercise.progressSets += 1
    exercises.set(key, exercise)
  }

  const ranking = []
  for (const exercise of exercises.values()) {
    ranking.push({ ...exercise, sessions: exercise.dates.size })
  }
  ranking.sort(compareSetCount)
  return ranking
}

function createExerciseSummary(set) {
  return {
    id: set.exerciseId,
    name: set.exerciseName,
    muscleName: set.muscleName,
    color: set.muscleColor,
    sets: 0,
    reps: 0,
    volume: 0,
    progressSets: 0,
    dates: new Set(),
  }
}

function uniqueValues(rows, field) {
  const values = new Set()
  for (const row of rows) values.add(String(row[field]))
  return values
}

function sumValues(rows, field) {
  let total = 0
  for (const row of rows) total += row[field]
  return total
}

function countProgressSets(sets) {
  let count = 0
  for (const set of sets) {
    if (set.isProgress) count += 1
  }
  return count
}

function calculateLongestStreak(workoutDays) {
  const dates = [...workoutDays].sort()
  if (!dates.length) return 0

  let longest = 1
  let current = 1
  for (let index = 1; index < dates.length; index += 1) {
    if (differenceInDays(dates[index - 1], dates[index]) === 1) current += 1
    else current = 1
    longest = Math.max(longest, current)
  }
  return longest
}

function compareSetCount(first, second) {
  return second.sets - first.sets || first.name.localeCompare(second.name)
}
