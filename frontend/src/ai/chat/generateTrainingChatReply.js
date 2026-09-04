import { TRAINING_CHAT_MODEL } from './trainingChatModel.js'
import { buildTrainingChatStatistics } from './trainingChatStatistics.js'
import { classifyTrainingIntent } from './trainingIntentClassifier.js'
import { detectTrainingQuestionLanguage } from './trainingQuestionLanguage.js'

export function generateTrainingChatReply(question, sets) {
  const language = detectTrainingQuestionLanguage(question)
  const intent = classifyTrainingIntent(TRAINING_CHAT_MODEL, question)
  const statistics = buildTrainingChatStatistics(sets)

  if (intent === 'greeting') return greetingReply(language)
  if (intent === 'help') return helpReply(language)
  if (intent === 'summary') return summaryReply(language, statistics)
  if (intent === 'total-sets') return totalSetsReply(language, statistics)
  if (intent === 'workout-count') return workoutCountReply(language, statistics)
  if (intent === 'top-muscle') return topMuscleReply(language, statistics)
  if (intent === 'top-exercise') return topExerciseReply(language, statistics)
  if (intent === 'volume') return volumeReply(language, statistics)
  return unknownReply(language)
}

function greetingReply(language) {
  if (language === 'pt') {
    return 'Olá! Podes perguntar-me sobre o resumo dos teus treinos, sets, frequência, músculo mais treinado, exercício mais usado ou volume total.'
  }

  return 'Hi! You can ask me about your training summary, sets, frequency, most trained muscle, most used exercise, or total volume.'
}

function helpReply(language) {
  if (language === 'pt') {
    return 'Por agora consigo responder a perguntas simples sobre os teus dados de treino: resumo, total de sets, número de treinos, músculo mais treinado, exercício mais usado e volume total.'
  }

  return 'For now I can answer simple questions about your training data: summary, total sets, workout count, most trained muscle, most used exercise, and total volume.'
}

function summaryReply(language, statistics) {
  if (!statistics.totalSets) return emptyTrainingReply(language)

  const muscle = statistics.topMuscle
  const exercise = statistics.topExercise

  if (language === 'pt') {
    let reply = 'No teu histórico registado tens '
      + pluralize(statistics.totalSets, 'set', 'sets')
      + ' em '
      + pluralize(statistics.workoutCount, 'dia de treino', 'dias de treino')
      + '.'

    if (muscle) {
      reply += ' O músculo mais treinado é ' + muscle.name + ' com ' + pluralize(muscle.sets, 'set', 'sets') + '.'
    }

    if (exercise) {
      reply += ' O exercício mais usado é ' + exercise.name + ' com ' + pluralize(exercise.sets, 'set', 'sets') + '.'
    }

    reply += ' O volume total registado é ' + formatVolume(statistics.totalVolume, language) + '.'
    return reply
  }

  let reply = 'Across your logged history you have '
    + pluralize(statistics.totalSets, 'set', 'sets')
    + ' over '
    + pluralize(statistics.workoutCount, 'workout day', 'workout days')
    + '.'

  if (muscle) {
    reply += ' Your most trained muscle is ' + muscle.name + ' with ' + pluralize(muscle.sets, 'set', 'sets') + '.'
  }

  if (exercise) {
    reply += ' Your most used exercise is ' + exercise.name + ' with ' + pluralize(exercise.sets, 'set', 'sets') + '.'
  }

  reply += ' Your recorded total volume is ' + formatVolume(statistics.totalVolume, language) + '.'
  return reply
}

function totalSetsReply(language, statistics) {
  if (!statistics.totalSets) return emptyTrainingReply(language)

  if (language === 'pt') {
    return 'Tens ' + pluralize(statistics.totalSets, 'set registado', 'sets registados') + ' no teu histórico de treino.'
  }

  return 'You have ' + pluralize(statistics.totalSets, 'logged set', 'logged sets') + ' in your training history.'
}

function workoutCountReply(language, statistics) {
  if (!statistics.totalSets) return emptyTrainingReply(language)

  if (language === 'pt') {
    return 'Treinaste em ' + pluralize(statistics.workoutCount, 'dia', 'dias') + ' diferentes no histórico registado.'
  }

  return 'You trained on ' + pluralize(statistics.workoutCount, 'different day', 'different days') + ' in your logged history.'
}

function topMuscleReply(language, statistics) {
  if (!statistics.totalSets || !statistics.topMuscle) return emptyTrainingReply(language)

  const muscle = statistics.topMuscle
  if (language === 'pt') {
    return muscle.name + ' é o teu músculo mais treinado, com ' + pluralize(muscle.sets, 'set', 'sets') + '.'
  }

  return muscle.name + ' is your most trained muscle, with ' + pluralize(muscle.sets, 'set', 'sets') + '.'
}

function topExerciseReply(language, statistics) {
  if (!statistics.totalSets || !statistics.topExercise) return emptyTrainingReply(language)

  const exercise = statistics.topExercise
  if (language === 'pt') {
    return exercise.name + ' é o teu exercício mais usado, com ' + pluralize(exercise.sets, 'set', 'sets') + '.'
  }

  return exercise.name + ' is your most used exercise, with ' + pluralize(exercise.sets, 'set', 'sets') + '.'
}

function volumeReply(language, statistics) {
  if (!statistics.totalSets) return emptyTrainingReply(language)

  if (language === 'pt') {
    return 'O teu volume total registado é ' + formatVolume(statistics.totalVolume, language) + '.'
  }

  return 'Your recorded total training volume is ' + formatVolume(statistics.totalVolume, language) + '.'
}

function emptyTrainingReply(language) {
  if (language === 'pt') {
    return 'Ainda não tens dados de treino suficientes para eu responder a isso.'
  }

  return 'You do not have enough logged training data for me to answer that yet.'
}

function unknownReply(language) {
  if (language === 'pt') return 'Isto ainda não está no meu âmbito.'
  return 'This is not in my scope yet.'
}

function pluralize(value, singular, plural) {
  return value + ' ' + (value === 1 ? singular : plural)
}

function formatVolume(value, language) {
  const locale = language === 'pt' ? 'pt-PT' : 'en-US'
  return Number(value).toLocaleString(locale, { maximumFractionDigits: 1 }) + ' kg'
}
