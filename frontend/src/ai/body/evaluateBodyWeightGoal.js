const VALID_GOALS = new Set(['cutting', 'maintenance', 'bulking'])

export function evaluateBodyWeightGoal(trend, goal) {
  if (!VALID_GOALS.has(goal)) return rating('insufficient', 'Choose a goal')
  if (!trend?.hasEnoughData) return rating('insufficient', 'More data needed')

  if (goal === 'cutting') return evaluateCutting(trend.weeklyChangePercent)
  if (goal === 'bulking') return evaluateBulking(trend.weeklyChangePercent)
  return evaluateMaintenance(trend.weeklyChangePercent)
}

function evaluateCutting(weeklyChange) {
  if (weeklyChange <= -0.2 && weeklyChange >= -1) return rating('great', 'On track')
  if (weeklyChange < -1 && weeklyChange >= -1.5) return rating('average', 'Moving fast')
  if (weeklyChange < -1.5) return rating('bad', 'Too fast')
  if (weeklyChange > 0.75) return rating('terrible', 'Wrong direction')
  if (weeklyChange > 0.1) return rating('bad', 'Wrong direction')
  return rating('average', 'Moving slowly')
}

function evaluateMaintenance(weeklyChange) {
  const absoluteChange = Math.abs(weeklyChange)
  if (absoluteChange <= 0.25) return rating('great', 'Stable')
  if (absoluteChange <= 0.5) return rating('average', 'Small drift')
  if (absoluteChange <= 1) return rating('bad', 'Off target')
  return rating('terrible', 'Far off target')
}

function evaluateBulking(weeklyChange) {
  if (weeklyChange >= 0.1 && weeklyChange <= 0.5) return rating('great', 'On track')
  if (weeklyChange > 0.5 && weeklyChange <= 0.8) return rating('average', 'Moving fast')
  if (weeklyChange > 1.5) return rating('terrible', 'Too fast')
  if (weeklyChange > 0.8) return rating('bad', 'Too fast')
  if (weeklyChange < -0.75) return rating('terrible', 'Wrong direction')
  if (weeklyChange < -0.1) return rating('bad', 'Wrong direction')
  return rating('average', 'Moving slowly')
}

function rating(level, label) {
  return { level, label }
}
