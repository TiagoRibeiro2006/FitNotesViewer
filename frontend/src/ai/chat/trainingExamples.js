export const TRAINING_INTENT_EXAMPLES = [
  example('greeting', 'hello'),
  example('greeting', 'hi there'),
  example('greeting', 'hey'),
  example('greeting', 'olá'),
  example('greeting', 'bom dia'),
  example('greeting', 'boa tarde'),

  example('help', 'what can you answer'),
  example('help', 'what can I ask'),
  example('help', 'how can you help me'),
  example('help', 'o que posso perguntar'),
  example('help', 'como podes ajudar'),

  example('summary', 'summarize my training'),
  example('summary', 'summarize my workouts'),
  example('summary', 'give me a training summary'),
  example('summary', 'give me an overview of my workouts'),
  example('summary', 'how is my training going'),
  example('summary', 'resume o meu treino'),
  example('summary', 'faz um resumo dos meus treinos'),
  example('summary', 'como está o meu treino'),

  example('total-sets', 'how many sets did I do'),
  example('total-sets', 'tell me my total sets'),
  example('total-sets', 'what is my set count'),
  example('total-sets', 'quantos sets fiz'),
  example('total-sets', 'qual é o total de séries'),

  example('workout-count', 'how many workouts did I do'),
  example('workout-count', 'how often did I train'),
  example('workout-count', 'tell me my training frequency'),
  example('workout-count', 'quantos treinos fiz'),
  example('workout-count', 'quantas vezes treinei'),

  example('top-muscle', 'what is my most trained muscle'),
  example('top-muscle', 'which muscle did I train most'),
  example('top-muscle', 'show my top muscle'),
  example('top-muscle', 'qual músculo treinei mais'),
  example('top-muscle', 'qual é o músculo mais treinado'),

  example('top-exercise', 'what is my most used exercise'),
  example('top-exercise', 'which exercise did I do most'),
  example('top-exercise', 'show my top exercise'),
  example('top-exercise', 'qual exercício fiz mais'),
  example('top-exercise', 'qual é o exercício mais usado'),

  example('volume', 'what is my total training volume'),
  example('volume', 'how much weight did I lift'),
  example('volume', 'tell me my workout volume'),
  example('volume', 'qual é o volume total'),
  example('volume', 'quanto peso levantei'),
]

function example(intent, text) {
  return { intent, text }
}
