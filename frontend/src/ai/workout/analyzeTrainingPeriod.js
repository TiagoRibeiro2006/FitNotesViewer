import { calculateMuscleDistribution } from './metrics/muscleDistribution.js'
import { calculateMuscleFrequency } from './metrics/muscleFrequency.js'
import { calculateMuscleSets } from './metrics/muscleSets.js'
import { calculateWorkoutSets } from './metrics/workoutSets.js'
import { calculateBodyRegions } from './metrics/bodyRegions.js'
import { calculateExerciseConsistency } from './metrics/exerciseConsistency.js'
import { calculateSetConsistency } from './metrics/setConsistency.js'

export function analyzeTrainingPeriod(workouts) {
  const workoutMetrics = calculateWorkoutSets(workouts)
  const muscleSets = calculateMuscleSets(workouts)
  const muscleFrequency = calculateMuscleFrequency(workouts)
  const muscleDistribution = calculateMuscleDistribution(muscleSets, workoutMetrics.totalSets)

  return {
    totalSets: workoutMetrics.totalSets,
    workoutCount: workoutMetrics.workouts.length,
    workouts: workoutMetrics.workouts,
    muscles: buildMuscleMetrics(muscleSets, muscleFrequency, muscleDistribution),
    regions: calculateBodyRegions(workouts),
    consistency: {
      exercises: calculateExerciseConsistency(workouts),
      sets: calculateSetConsistency(workouts),
    },
  }
}

function buildMuscleMetrics(muscleSets, muscleFrequency, muscleDistribution) {
  const muscles = new Map()

  for (const [muscleName, totalSets] of Object.entries(muscleSets)) {
    muscles.set(muscleName, {
      frequency: muscleFrequency[muscleName] ?? 0,
      totalSets,
      distribution: muscleDistribution[muscleName] ?? 0,
    })
  }

  return Object.fromEntries(muscles)
}
