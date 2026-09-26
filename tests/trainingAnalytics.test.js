import assert from 'node:assert/strict'
import test from 'node:test'
import { createTrainingAnalytics } from '../src/features/charts/analytics/trainingAnalytics.js'

const DATA = {
  categories: [
    { id: 10, name: 'Chest', colour: -65536 },
    { id: 20, name: 'Back', colour: -16776961 },
  ],
  exercises: [
    { id: 1, name: 'Bench Press', categoryId: 10 },
    { id: 2, name: 'Row', categoryId: 20 },
  ],
  workoutSets: [
    { id: 1, date: '2026-09-21', exerciseId: 1, weight: 100, reps: 5 },
    { id: 2, date: '2026-09-22', exerciseId: 1, weight: 105, reps: 5 },
    { id: 3, date: '2026-09-24', exerciseId: 2, weight: 80, reps: 8 },
    { id: 4, date: 'invalid', exerciseId: 2, weight: 80, reps: 8 },
    { id: 5, date: '2026-09-25', exerciseId: 2, weight: 'invalid', reps: 8 },
  ],
}

test('summarizes valid training sets, progress and consecutive workout days', () => {
  const analytics = createTrainingAnalytics(DATA, '2026-09-21', '2026-09-27')

  assert.equal(analytics.totalSets, 3)
  assert.equal(analytics.totalVolume, 1665)
  assert.equal(analytics.totalReps, 18)
  assert.equal(analytics.progressSets, 3)
  assert.equal(analytics.workoutCount, 3)
  assert.equal(analytics.exerciseCount, 2)
  assert.equal(analytics.averageSetsPerWorkout, 1)
  assert.equal(analytics.workoutsPerWeek, 3)
  assert.equal(analytics.longestStreak, 2)
  assert.deepEqual(analytics.exerciseRanking.map((item) => item.name), ['Bench Press', 'Row'])
})

test('filters training analytics by muscle without changing historical progress', () => {
  const analytics = createTrainingAnalytics(DATA, '2026-09-22', '2026-09-27', 10)

  assert.equal(analytics.totalSets, 1)
  assert.equal(analytics.sets[0].exerciseName, 'Bench Press')
  assert.equal(analytics.sets[0].muscleName, 'Chest')
  assert.equal(analytics.sets[0].isProgress, true)
  assert.deepEqual(analytics.muscleDistribution.map((item) => item.name), ['Chest'])
})
