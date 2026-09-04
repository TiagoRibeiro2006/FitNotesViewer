export function calculateMuscleDistribution(muscleSets, totalSets) {
  if (!totalSets) return {}

  const distribution = new Map()

  for (const [muscleName, setCount] of Object.entries(muscleSets)) {
    distribution.set(muscleName, percentage(setCount, totalSets))
  }

  return Object.fromEntries(distribution)
}

function percentage(value, total) {
  return Math.round((value / total) * 1000) / 10
}
