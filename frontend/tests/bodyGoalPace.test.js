import test from 'node:test'
import assert from 'node:assert/strict'

import { evaluateBodyWeightGoal } from '../src/ai/body/evaluateBodyWeightGoal.js'
import { generateBodyWeightFeedback } from '../src/ai/body/generateBodyWeightFeedback.js'

function trend(weeklyChangePercent) {
  return {
    hasEnoughData: true,
    weeklyChangePercent,
    change: weeklyChangePercent,
    periodDays: 21,
  }
}

test('bulking target treats roughly 0.5-2% per month as on track', () => {
  const weeksPerMonth = 365.25 / 12 / 7

  assert.equal(evaluateBodyWeightGoal(trend(0.5 / weeksPerMonth), 'bulking').label, 'On track')
  assert.equal(evaluateBodyWeightGoal(trend(2 / weeksPerMonth), 'bulking').label, 'On track')
  assert.equal(evaluateBodyWeightGoal(trend(0.4 / weeksPerMonth), 'bulking').label, 'Moving slowly')
  assert.equal(evaluateBodyWeightGoal(trend(2.2 / weeksPerMonth), 'bulking').label, 'Moving fast')
  assert.equal(evaluateBodyWeightGoal(trend(3 / weeksPerMonth), 'bulking').label, 'Too fast')
})

test('cutting target treats 0.5-1% loss per week as on track', () => {
  assert.equal(evaluateBodyWeightGoal(trend(-0.5), 'cutting').label, 'On track')
  assert.equal(evaluateBodyWeightGoal(trend(-1), 'cutting').label, 'On track')
  assert.equal(evaluateBodyWeightGoal(trend(-0.3), 'cutting').label, 'Moving slowly')
  assert.equal(evaluateBodyWeightGoal(trend(-1.1), 'cutting').label, 'Moving fast')
  assert.equal(evaluateBodyWeightGoal(trend(-1.4), 'cutting').label, 'Too fast')
})

test('body feedback reports bulk pace per month and includes the target range', () => {
  const result = evaluateBodyWeightGoal(trend(0.25), 'bulking')
  const feedback = generateBodyWeightFeedback(trend(0.25), result, 'bulking')

  assert.match(feedback, /% per month/)
  assert.match(feedback, /\+0\.5% to \+2%/)
})

test('body feedback reports cut pace per week and includes the target range', () => {
  const result = evaluateBodyWeightGoal(trend(-0.7), 'cutting')
  const feedback = generateBodyWeightFeedback(trend(-0.7), result, 'cutting')

  assert.match(feedback, /% per week/)
  assert.match(feedback, /-0\.5% to -1%/)
})
