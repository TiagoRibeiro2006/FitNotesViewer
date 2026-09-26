import { TRAINING_INTENT_EXAMPLES } from './trainingExamples.js'
import { trainIntentClassifier } from './trainingIntentClassifier.js'

export const TRAINING_CHAT_MODEL = trainIntentClassifier(TRAINING_INTENT_EXAMPLES)
