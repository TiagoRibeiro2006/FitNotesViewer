import { TRAINING_CHAT_MODEL } from './trainingChatModel.js'
import { createTrainingChatReply } from './trainingChatReplies.js'
import { buildTrainingChatStatistics } from './trainingChatStatistics.js'
import { findTrainingEntity } from './trainingEntityMatcher.js'
import { classifyTrainingIntent } from './trainingIntentClassifier.js'
import { refineTrainingIntent } from './trainingIntentHints.js'
import { detectTrainingQuestionLanguage } from './trainingQuestionLanguage.js'

export function generateTrainingChatReply(question, sets) {
  const language = detectTrainingQuestionLanguage(question)
  const classifiedIntent = classifyTrainingIntent(TRAINING_CHAT_MODEL, question)
  const intent = refineTrainingIntent(question, classifiedIntent)
  const statistics = buildTrainingChatStatistics(sets)
  const entity = findTrainingEntity(question, statistics)

  return createTrainingChatReply(intent, language, statistics, entity)
}
