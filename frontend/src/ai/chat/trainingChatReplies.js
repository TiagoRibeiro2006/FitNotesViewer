export function createTrainingChatReply(intent, language, statistics, entity) {
  if (intent === 'greeting') return greetingReply(language)
  if (intent === 'help') return helpReply(language)
  if (!statistics.totalSets) return emptyTrainingReply(language)
  if (entity && supportsEntity(intent)) return entityReply(intent, language, entity)
  if (intent === 'summary') return summaryReply(language, statistics)
  if (intent === 'total-sets') return totalSetsReply(language, statistics)
  if (intent === 'total-reps') return totalRepsReply(language, statistics)
  if (intent === 'workout-count') return workoutCountReply(language, statistics)
  if (intent === 'average-sets') return averageSetsReply(language, statistics)
  if (intent === 'frequency') return frequencyReply(language, statistics)
  if (intent === 'top-muscle') return topMuscleReply(language, statistics)
  if (intent === 'least-muscle') return leastMuscleReply(language, statistics)
  if (intent === 'top-exercise') return topExerciseReply(language, statistics)
  if (intent === 'volume') return volumeReply(language, statistics)
  if (intent === 'progress') return progressReply(language, statistics)
  if (intent === 'recent-workout') return recentWorkoutReply(language, statistics)
  if (intent === 'best-set') return bestSetReply(language, statistics.heaviestSet)
  if (intent === 'date-range') return dateRangeReply(language, statistics)
  if (intent === 'distribution') return distributionReply(language, statistics)
  if (intent === 'advice') return adviceReply(language, statistics)
  return unknownReply(language)
}

function supportsEntity(intent) {
  return intent === 'unknown'
    || intent === 'summary'
    || intent === 'total-sets'
    || intent === 'total-reps'
    || intent === 'workout-count'
    || intent === 'frequency'
    || intent === 'volume'
    || intent === 'best-set'
}

function greetingReply(language) {
  if (language === 'pt') {
    return 'Olá! Posso analisar o teu histórico, responder sobre um músculo ou exercício específico e ajudar-te a encontrar padrões no treino.'
  }

  return 'Hi! I can analyse your history, answer questions about a specific muscle or exercise, and help you find patterns in your training.'
}

function helpReply(language) {
  if (language === 'pt') {
    return 'Podes perguntar pelo resumo, sets, repetições, volume, frequência, médias, progresso, último treino, melhor set ou músculos e exercícios específicos. Também podes pedir uma sugestão sobre o treino.'
  }

  return 'You can ask about your summary, sets, reps, volume, frequency, averages, progress, latest workout, best set, or a specific muscle and exercise. You can also ask for a training suggestion.'
}

function summaryReply(language, statistics) {
  const range = formatDateRange(statistics, language)
  const muscle = statistics.topMuscle
  const exercise = statistics.topExercise

  if (language === 'pt') {
    let reply = 'Entre ' + range + ', registaste '
      + pluralize(statistics.totalSets, 'set', 'sets')
      + ' em '
      + pluralize(statistics.workoutCount, 'dia de treino', 'dias de treino')
      + ', com uma média de '
      + formatNumber(statistics.averageSetsPerWorkout, language)
      + ' sets por treino.'

    if (muscle) reply += ' ' + muscle.name + ' foi o músculo mais treinado (' + formatPercentage(muscle.distribution, language) + ').'
    if (exercise) reply += ' O exercício mais usado foi ' + exercise.name + ', com ' + pluralize(exercise.sets, 'set', 'sets') + '.'
    return reply
  }

  let reply = 'Between ' + range + ', you logged '
    + pluralize(statistics.totalSets, 'set', 'sets')
    + ' across '
    + pluralize(statistics.workoutCount, 'workout day', 'workout days')
    + ', averaging '
    + formatNumber(statistics.averageSetsPerWorkout, language)
    + ' sets per workout.'

  if (muscle) reply += ' ' + muscle.name + ' was your most trained muscle (' + formatPercentage(muscle.distribution, language) + ').'
  if (exercise) reply += ' Your most used exercise was ' + exercise.name + ', with ' + pluralize(exercise.sets, 'set', 'sets') + '.'
  return reply
}

function totalSetsReply(language, statistics) {
  if (language === 'pt') {
    return 'Tens ' + pluralize(statistics.totalSets, 'set registado', 'sets registados')
      + ', uma média de ' + formatNumber(statistics.averageSetsPerWorkout, language) + ' por treino.'
  }

  return 'You have ' + pluralize(statistics.totalSets, 'logged set', 'logged sets')
    + ', averaging ' + formatNumber(statistics.averageSetsPerWorkout, language) + ' per workout.'
}

function totalRepsReply(language, statistics) {
  if (language === 'pt') return 'Registaste um total de ' + pluralize(statistics.totalReps, 'repetição', 'repetições') + '.'
  return 'You logged a total of ' + pluralize(statistics.totalReps, 'rep', 'reps') + '.'
}

function workoutCountReply(language, statistics) {
  if (language === 'pt') {
    return 'Treinaste em ' + pluralize(statistics.workoutCount, 'dia diferente', 'dias diferentes')
      + ' entre ' + formatDateRange(statistics, language) + '.'
  }

  return 'You trained on ' + pluralize(statistics.workoutCount, 'different day', 'different days')
    + ' between ' + formatDateRange(statistics, language) + '.'
}

function averageSetsReply(language, statistics) {
  if (language === 'pt') {
    return 'A tua média é de ' + formatNumber(statistics.averageSetsPerWorkout, language)
      + ' sets por treino, calculada a partir de ' + pluralize(statistics.workoutCount, 'treino', 'treinos') + '.'
  }

  return 'You average ' + formatNumber(statistics.averageSetsPerWorkout, language)
    + ' sets per workout, based on ' + pluralize(statistics.workoutCount, 'workout', 'workouts') + '.'
}

function frequencyReply(language, statistics) {
  const muscle = statistics.topMuscle
  if (!muscle) return emptyTrainingReply(language)

  if (language === 'pt') {
    return 'Treinaste em ' + pluralize(statistics.workoutCount, 'dia', 'dias') + '. '
      + muscle.name + ' teve a maior frequência, aparecendo em ' + pluralize(muscle.workouts, 'treino', 'treinos') + '.'
  }

  return 'You trained on ' + pluralize(statistics.workoutCount, 'day', 'days') + '. '
    + muscle.name + ' had the highest frequency, appearing in ' + pluralize(muscle.workouts, 'workout', 'workouts') + '.'
}

function topMuscleReply(language, statistics) {
  const muscle = statistics.topMuscle
  if (!muscle) return emptyTrainingReply(language)

  if (language === 'pt') {
    return muscle.name + ' é o músculo mais treinado: ' + pluralize(muscle.sets, 'set', 'sets')
      + ' em ' + pluralize(muscle.workouts, 'treino', 'treinos')
      + ', correspondendo a ' + formatPercentage(muscle.distribution, language) + ' do total.'
  }

  return muscle.name + ' is your most trained muscle: ' + pluralize(muscle.sets, 'set', 'sets')
    + ' across ' + pluralize(muscle.workouts, 'workout', 'workouts')
    + ', representing ' + formatPercentage(muscle.distribution, language) + ' of the total.'
}

function leastMuscleReply(language, statistics) {
  const muscle = statistics.leastMuscle
  if (!muscle) return emptyTrainingReply(language)

  if (statistics.muscles.length === 1) {
    if (language === 'pt') return 'Só existe um músculo no período registado: ' + muscle.name + '.'
    return 'There is only one muscle in the logged period: ' + muscle.name + '.'
  }

  if (language === 'pt') {
    return muscle.name + ' é o músculo com menos trabalho registado: '
      + pluralize(muscle.sets, 'set', 'sets') + ' em ' + pluralize(muscle.workouts, 'treino', 'treinos') + '.'
  }

  return muscle.name + ' has the least logged work: '
    + pluralize(muscle.sets, 'set', 'sets') + ' across ' + pluralize(muscle.workouts, 'workout', 'workouts') + '.'
}

function topExerciseReply(language, statistics) {
  const exercise = statistics.topExercise
  if (!exercise) return emptyTrainingReply(language)

  if (language === 'pt') {
    return exercise.name + ' é o exercício mais usado: ' + pluralize(exercise.sets, 'set', 'sets')
      + ' em ' + pluralize(exercise.workouts, 'treino', 'treinos') + '.'
  }

  return exercise.name + ' is your most used exercise: ' + pluralize(exercise.sets, 'set', 'sets')
    + ' across ' + pluralize(exercise.workouts, 'workout', 'workouts') + '.'
}

function volumeReply(language, statistics) {
  if (language === 'pt') return 'O volume total registado é ' + formatVolume(statistics.totalVolume, language) + '.'
  return 'Your recorded total training volume is ' + formatVolume(statistics.totalVolume, language) + '.'
}

function progressReply(language, statistics) {
  if (language === 'pt') {
    if (!statistics.progressSets) return 'Ainda não encontrei sets marcados como progresso no histórico analisado.'
    return 'Tens ' + pluralize(statistics.progressSets, 'set de progresso', 'sets de progresso')
      + ', o equivalente a ' + formatPercentage(statistics.progressRate, language) + ' dos sets registados.'
  }

  if (!statistics.progressSets) return 'I could not find any sets marked as progress in the analysed history yet.'
  return 'You have ' + pluralize(statistics.progressSets, 'progress set', 'progress sets')
    + ', representing ' + formatPercentage(statistics.progressRate, language) + ' of your logged sets.'
}

function recentWorkoutReply(language, statistics) {
  const workout = statistics.recentWorkout
  if (!workout) return emptyTrainingReply(language)

  if (language === 'pt') {
    return 'O treino mais recente foi em ' + formatDate(workout.date, language) + ': '
      + pluralize(workout.sets, 'set', 'sets') + ' de '
      + pluralize(workout.exerciseCount, 'exercício', 'exercícios')
      + ', com ' + pluralize(workout.reps, 'repetição', 'repetições') + '.'
  }

  return 'Your latest workout was on ' + formatDate(workout.date, language) + ': '
    + pluralize(workout.sets, 'set', 'sets') + ' across '
    + pluralize(workout.exerciseCount, 'exercise', 'exercises')
    + ', with ' + pluralize(workout.reps, 'rep', 'reps') + '.'
}

function bestSetReply(language, set) {
  if (!set) return emptyTrainingReply(language)
  const exercise = set.exerciseName || (language === 'pt' ? 'exercício desconhecido' : 'unknown exercise')

  if (language === 'pt') {
    return 'O set com mais peso foi ' + formatWeight(set.weight, language) + ' × '
      + pluralize(set.reps, 'repetição', 'repetições') + ' em ' + exercise
      + formatOptionalDate(set.date, language) + '.'
  }

  return 'Your heaviest set was ' + formatWeight(set.weight, language) + ' × '
    + pluralize(set.reps, 'rep', 'reps') + ' on ' + exercise
    + formatOptionalDate(set.date, language) + '.'
}

function dateRangeReply(language, statistics) {
  if (language === 'pt') return 'O histórico analisado vai de ' + formatDateRange(statistics, language) + '.'
  return 'The analysed history runs from ' + formatDateRange(statistics, language) + '.'
}

function distributionReply(language, statistics) {
  const top = statistics.topMuscle
  const least = statistics.leastMuscle
  if (!top) return emptyTrainingReply(language)

  if (language === 'pt') {
    let reply = top.name + ' tem a maior parte dos sets, com ' + formatPercentage(top.distribution, language) + '.'
    if (least && least !== top) reply += ' ' + least.name + ' tem a menor, com ' + formatPercentage(least.distribution, language) + '.'
    return reply
  }

  let reply = top.name + ' has the largest share of your sets at ' + formatPercentage(top.distribution, language) + '.'
  if (least && least !== top) reply += ' ' + least.name + ' has the smallest at ' + formatPercentage(least.distribution, language) + '.'
  return reply
}

function adviceReply(language, statistics) {
  if (statistics.workoutCount < 2) {
    if (language === 'pt') return 'Só há um treino registado. Adiciona mais sessões antes de tirar conclusões e compara a execução ao longo do tempo.'
    return 'Only one workout is logged. Add more sessions before drawing conclusions and compare your performance over time.'
  }

  if (statistics.muscles.length === 1) {
    if (language === 'pt') return 'Todo o trabalho registado está concentrado em ' + statistics.topMuscle.name + '. Se não for intencional, inclui outros grupos musculares.'
    return 'All logged work is focused on ' + statistics.topMuscle.name + '. If that is not intentional, include other muscle groups.'
  }

  if (statistics.topMuscle.distribution >= 50) {
    if (language === 'pt') return statistics.topMuscle.name + ' representa ' + formatPercentage(statistics.topMuscle.distribution, language) + ' dos sets. Se não for uma fase de especialização, distribui parte desse trabalho pelos músculos menos treinados.'
    return statistics.topMuscle.name + ' represents ' + formatPercentage(statistics.topMuscle.distribution, language) + ' of your sets. If this is not a specialization phase, move some work towards less-trained muscles.'
  }

  if (statistics.averageSetsPerWorkout > 20) {
    if (language === 'pt') return 'Os treinos têm em média ' + formatNumber(statistics.averageSetsPerWorkout, language) + ' sets. Se a qualidade cair no fim, considera dividir o volume por mais sessões.'
    return 'Your workouts average ' + formatNumber(statistics.averageSetsPerWorkout, language) + ' sets. If quality drops near the end, consider spreading the volume across more sessions.'
  }

  if (!statistics.progressSets) {
    if (language === 'pt') return 'A distribuição não mostra um desequilíbrio extremo, mas ainda não há sets marcados como progresso. Mantém alguns exercícios estáveis para comparar peso e repetições.'
    return 'The distribution shows no extreme imbalance, but no sets are marked as progress yet. Keep a few exercises stable so weight and reps are easier to compare.'
  }

  if (language === 'pt') return 'O histórico não mostra um problema óbvio. Continua a repetir os exercícios principais e procura progressos pequenos em peso ou repetições sem perder consistência.'
  return 'Your history does not show an obvious issue. Keep repeating your main exercises and aim for small improvements in weight or reps without losing consistency.'
}

function entityReply(intent, language, entity) {
  const group = entity.group
  if (intent === 'total-sets') return entitySetsReply(language, group)
  if (intent === 'total-reps') return entityRepsReply(language, group)
  if (intent === 'workout-count' || intent === 'frequency') return entityFrequencyReply(language, group)
  if (intent === 'volume') return entityVolumeReply(language, group)
  if (intent === 'best-set') return entityBestSetReply(language, entity)
  return entitySummaryReply(language, entity)
}

function entitySummaryReply(language, entity) {
  const group = entity.group
  const label = entity.type === 'muscle'
    ? (language === 'pt' ? 'músculo' : 'muscle')
    : (language === 'pt' ? 'exercício' : 'exercise')

  if (language === 'pt') {
    return group.name + ' é um ' + label + ' com ' + pluralize(group.sets, 'set', 'sets')
      + ' em ' + pluralize(group.workouts, 'treino', 'treinos')
      + '. Representa ' + formatPercentage(group.distribution, language)
      + ' dos teus sets e soma ' + formatVolume(group.volume, language) + ' de volume.'
  }

  return group.name + ' is a logged ' + label + ' with ' + pluralize(group.sets, 'set', 'sets')
    + ' across ' + pluralize(group.workouts, 'workout', 'workouts')
    + '. It represents ' + formatPercentage(group.distribution, language)
    + ' of your sets and ' + formatVolume(group.volume, language) + ' of volume.'
}

function entitySetsReply(language, group) {
  if (language === 'pt') return group.name + ' tem ' + pluralize(group.sets, 'set registado', 'sets registados') + '.'
  return group.name + ' has ' + pluralize(group.sets, 'logged set', 'logged sets') + '.'
}

function entityRepsReply(language, group) {
  if (language === 'pt') return group.name + ' soma ' + pluralize(group.reps, 'repetição', 'repetições') + '.'
  return group.name + ' has ' + pluralize(group.reps, 'logged rep', 'logged reps') + '.'
}

function entityFrequencyReply(language, group) {
  if (language === 'pt') return group.name + ' aparece em ' + pluralize(group.workouts, 'treino diferente', 'treinos diferentes') + '.'
  return group.name + ' appears in ' + pluralize(group.workouts, 'different workout', 'different workouts') + '.'
}

function entityVolumeReply(language, group) {
  if (language === 'pt') return group.name + ' tem ' + formatVolume(group.volume, language) + ' de volume registado.'
  return group.name + ' has ' + formatVolume(group.volume, language) + ' of logged volume.'
}

function entityBestSetReply(language, entity) {
  const set = entity.group.bestSet
  if (!set) return emptyTrainingReply(language)

  if (language === 'pt') {
    return 'O melhor set registado de ' + entity.group.name + ' por peso foi '
      + formatWeight(set.weight, language) + ' × ' + pluralize(set.reps, 'repetição', 'repetições')
      + formatOptionalDate(set.date, language) + '.'
  }

  return 'The heaviest logged set for ' + entity.group.name + ' was '
    + formatWeight(set.weight, language) + ' × ' + pluralize(set.reps, 'rep', 'reps')
    + formatOptionalDate(set.date, language) + '.'
}

function emptyTrainingReply(language) {
  if (language === 'pt') return 'Ainda não tens dados de treino suficientes para eu responder a isso.'
  return 'You do not have enough logged training data for me to answer that yet.'
}

function unknownReply(language) {
  if (language === 'pt') {
    return 'Ainda não percebi essa pergunta. Experimenta algo como “quantos sets fiz?”, “qual foi o meu último treino?”, “melhor set de Bench Press” ou “como posso melhorar?”.'
  }

  return 'I did not understand that question yet. Try “how many sets did I do?”, “what was my latest workout?”, “best Bench Press set”, or “how can I improve?”.'
}

function pluralize(value, singular, plural) {
  return formatInteger(value) + ' ' + (Number(value) === 1 ? singular : plural)
}

function formatInteger(value) {
  return Number.isFinite(Number(value)) ? String(Number(value)) : '0'
}

function formatNumber(value, language) {
  return Number(value).toLocaleString(readLocale(language), { maximumFractionDigits: 1 })
}

function formatPercentage(value, language) {
  return formatNumber(value, language) + '%'
}

function formatWeight(value, language) {
  return formatNumber(value, language) + ' kg'
}

function formatVolume(value, language) {
  return Number(value).toLocaleString(readLocale(language), { maximumFractionDigits: 1 }) + ' kg'
}

function formatDateRange(statistics, language) {
  return formatDate(statistics.firstDate, language) + ' ' + (language === 'pt' ? 'e' : 'and') + ' ' + formatDate(statistics.lastDate, language)
}

function formatOptionalDate(date, language) {
  if (!date) return ''
  return language === 'pt' ? ', em ' + formatDate(date, language) : ', on ' + formatDate(date, language)
}

function formatDate(dateKey, language) {
  const parts = String(dateKey ?? '').split('-').map(Number)
  if (parts.length !== 3 || parts.some(isInvalidNumber)) return String(dateKey ?? '')

  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return new Intl.DateTimeFormat(readLocale(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function isInvalidNumber(value) {
  return !Number.isFinite(value)
}

function readLocale(language) {
  return language === 'pt' ? 'pt-PT' : 'en-US'
}
