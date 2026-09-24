import assert from 'node:assert/strict'
import test from 'node:test'
import { generateTrainingChatReply } from '../src/ai/chat/generateTrainingChatReply.js'
import { POUNDS } from '../src/shared/units/weightUnits.js'

const SETS = [{
  date: '2026-09-20',
  exerciseName: 'Bench Press',
  muscleName: 'Chest',
  weight: 100,
  reps: 8,
}]

test('formats chatbot weights in the selected unit', () => {
  const reply = generateTrainingChatReply('What was my heaviest set?', SETS, POUNDS)

  assert.match(reply, /220\.5 lb/)
  assert.doesNotMatch(reply, / kg/)
})

test('keeps kilograms as the default chatbot unit', () => {
  const reply = generateTrainingChatReply('What was my heaviest set?', SETS)

  assert.match(reply, /100 kg/)
})
