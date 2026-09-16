const VALID_GOALS = new Set(['cutting', 'maintenance', 'bulking'])
const WEEKS_PER_MONTH = 365.25 / 12 / 7

const CUT_TARGET_MIN_WEEKLY = 0.5
const CUT_TARGET_MAX_WEEKLY = 1.0
const BULK_TARGET_MIN_MONTHLY = 0.5
const BULK_TARGET_MAX_MONTHLY = 2.0

export function evaluateBodyWeightGoal(trend, goal) {
  if (!VALID_GOALS.has(goal)) return rating('insufficient', 'Choose a goal')
  if (!trend?.hasEnoughData) return rating('insufficient', 'More data needed')

  if (goal === 'cutting') return evaluateCutting(trend.weeklyChangePercent)
  if (goal === 'bulking') return evaluateBulking(trend.weeklyChangePercent)
  return evaluateMaintenance(trend.weeklyChangePercent)
}

function evaluateCutting(weeklyChange) {
  const weeklyLoss = -weeklyChange

  if (weeklyLoss >= CUT_TARGET_MIN_WEEKLY && weeklyLoss <= CUT_TARGET_MAX_WEEKLY) {
    return rating('great', 'On track')
  }

  if (weeklyLoss > CUT_TARGET_MAX_WEEKLY && weeklyLoss <= 1.25) {
    return rating('average', 'Moving fast')
  }

  if (weeklyLoss > 1.25 && weeklyLoss <= 1.5) {
    return rating('bad', 'Too fast')
  }

  if (weeklyLoss > 1.5) {
    return rating('terrible', 'Too fast')
  }

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
  const monthlyChange = weeklyChange * WEEKS_PER_MONTH

  if (monthlyChange >= BULK_TARGET_MIN_MONTHLY && monthlyChange <= BULK_TARGET_MAX_MONTHLY) {
    return rating('great', 'On track')
  }

  if (monthlyChange > BULK_TARGET_MAX_MONTHLY && monthlyChange <= 2.5) {
    return rating('average', 'Moving fast')
  }

  if (monthlyChange > 2.5 && monthlyChange <= 3.5) {
    return rating('bad', 'Too fast')
  }

  if (monthlyChange > 3.5) {
    return rating('terrible', 'Too fast')
  }

  if (monthlyChange < -3) return rating('terrible', 'Wrong direction')
  if (monthlyChange < -0.5) return rating('bad', 'Wrong direction')
  return rating('average', 'Moving slowly')
}

function rating(level, label) {
  return { level, label }
}
