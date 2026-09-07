export function buildTrainingChatStatistics(sets) {
  const workoutDates = new Set()
  const muscles = new Map()
  const exercises = new Map()
  let totalVolume = 0
  let totalSets = 0

  for (const set of sets ?? []) {
    totalSets += 1
    addWorkoutDate(workoutDates, set)
    addGroupSet(muscles, set?.muscleName)
    addGroupSet(exercises, set?.exerciseName)
    totalVolume += readSetVolume(set)
  }

  return {
    totalSets,
    workoutCount: workoutDates.size,
    totalVolume,
    topMuscle: findTopGroup(muscles),
    topExercise: findTopGroup(exercises),
  }
}

function addWorkoutDate(workoutDates, set) {
  const date = String(set?.date ?? '').trim()
  if (date) workoutDates.add(date)
}

function addGroupSet(groups, name) {
  const normalizedName = String(name ?? '').trim()
  if (!normalizedName) return

  const group = groups.get(normalizedName) ?? createGroup(normalizedName)
  group.sets += 1
  groups.set(normalizedName, group)
}

function createGroup(name) {
  return {
    name,
    sets: 0,
  }
}

function readSetVolume(set) {
  const storedVolume = Number(set?.volume)
  if (Number.isFinite(storedVolume)) return storedVolume

  const weight = Number(set?.weight)
  const reps = Number(set?.reps)
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return 0
  return weight * reps
}

function findTopGroup(groups) {
  let topGroup = null

  for (const group of groups.values()) {
    if (!topGroup || compareGroups(group, topGroup) < 0) topGroup = group
  }

  return topGroup
}

function compareGroups(first, second) {
  if (first.sets !== second.sets) return second.sets - first.sets
  return first.name.localeCompare(second.name)
}
