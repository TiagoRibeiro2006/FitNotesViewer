export function buildTrainingChatStatistics(sets) {
  const workoutDates = new Set()
  const muscleGroups = new Map()
  const exerciseGroups = new Map()
  const workouts = new Map()
  let totalVolume = 0
  let totalReps = 0
  let totalSets = 0
  let progressSets = 0
  let heaviestSet = null

  for (const set of sets ?? []) {
    const date = readDate(set)
    const volume = readSetVolume(set)
    const reps = readNumber(set?.reps)

    totalSets += 1
    totalVolume += volume
    totalReps += reps
    if (set?.isProgress === true) progressSets += 1

    addWorkoutDate(workoutDates, date)
    addGroupSet(muscleGroups, set?.muscleName, set, date, volume)
    addGroupSet(exerciseGroups, set?.exerciseName, set, date, volume)
    addWorkout(workouts, set, date, volume)
    heaviestSet = selectBetterSet(heaviestSet, set)
  }

  const muscles = finalizeGroups(muscleGroups, totalSets)
  const exercises = finalizeGroups(exerciseGroups, totalSets)
  const workoutList = finalizeWorkouts(workouts)
  const dates = [...workoutDates].sort()

  return {
    totalSets,
    totalReps,
    totalVolume,
    progressSets,
    progressRate: percentage(progressSets, totalSets),
    workoutCount: workoutDates.size,
    averageSetsPerWorkout: average(totalSets, workoutDates.size),
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    muscles,
    exercises,
    topMuscle: muscles[0] ?? null,
    leastMuscle: muscles[muscles.length - 1] ?? null,
    topExercise: exercises[0] ?? null,
    recentWorkout: workoutList[0] ?? null,
    heaviestSet,
  }
}

function addWorkoutDate(workoutDates, date) {
  if (date) workoutDates.add(date)
}

function addGroupSet(groups, name, set, date, volume) {
  const normalizedName = String(name ?? '').trim()
  if (!normalizedName) return

  const group = groups.get(normalizedName) ?? createGroup(normalizedName)
  group.sets += 1
  group.reps += readNumber(set?.reps)
  group.volume += volume
  if (date) group.workoutDates.add(date)
  group.bestSet = selectBetterSet(group.bestSet, set)
  groups.set(normalizedName, group)
}

function createGroup(name) {
  return {
    name,
    sets: 0,
    reps: 0,
    volume: 0,
    workoutDates: new Set(),
    bestSet: null,
  }
}

function finalizeGroups(groups, totalSets) {
  const result = []

  for (const group of groups.values()) {
    result.push({
      name: group.name,
      sets: group.sets,
      reps: group.reps,
      volume: group.volume,
      workouts: group.workoutDates.size,
      distribution: percentage(group.sets, totalSets),
      bestSet: group.bestSet,
    })
  }

  result.sort(compareGroups)
  return result
}

function addWorkout(workouts, set, date, volume) {
  if (!date) return

  const workout = workouts.get(date) ?? createWorkout(date)
  workout.sets += 1
  workout.reps += readNumber(set?.reps)
  workout.volume += volume

  const exerciseName = String(set?.exerciseName ?? '').trim()
  if (exerciseName) workout.exercises.add(exerciseName)
  workouts.set(date, workout)
}

function createWorkout(date) {
  return {
    date,
    sets: 0,
    reps: 0,
    volume: 0,
    exercises: new Set(),
  }
}

function finalizeWorkouts(workouts) {
  const result = []

  for (const workout of workouts.values()) {
    result.push({
      date: workout.date,
      sets: workout.sets,
      reps: workout.reps,
      volume: workout.volume,
      exerciseCount: workout.exercises.size,
    })
  }

  result.sort(compareWorkoutDates)
  return result
}

function selectBetterSet(current, candidate) {
  const normalizedCandidate = normalizeSet(candidate)
  if (!normalizedCandidate) return current
  if (!current || compareSets(normalizedCandidate, current) < 0) return normalizedCandidate
  return current
}

function normalizeSet(set) {
  const weight = Number(set?.weight)
  const reps = Number(set?.reps)
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null

  return {
    weight,
    reps,
    date: readDate(set),
    exerciseName: String(set?.exerciseName ?? '').trim(),
    muscleName: String(set?.muscleName ?? '').trim(),
  }
}

function readDate(set) {
  return String(set?.date ?? '').trim()
}

function readSetVolume(set) {
  const storedVolume = Number(set?.volume)
  if (Number.isFinite(storedVolume)) return storedVolume
  return readNumber(set?.weight) * readNumber(set?.reps)
}

function readNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function percentage(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 1000) / 10
}

function average(value, count) {
  if (!count) return 0
  return Math.round((value / count) * 10) / 10
}

function compareGroups(first, second) {
  if (first.sets !== second.sets) return second.sets - first.sets
  return first.name.localeCompare(second.name)
}

function compareWorkoutDates(first, second) {
  return second.date.localeCompare(first.date)
}

function compareSets(first, second) {
  if (first.weight !== second.weight) return second.weight - first.weight
  if (first.reps !== second.reps) return second.reps - first.reps
  return String(second.date ?? '').localeCompare(String(first.date ?? ''))
}
