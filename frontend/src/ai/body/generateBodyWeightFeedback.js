const GOAL_LABELS = {
  bulking: 'bulking',
  cutting: 'cutting',
  maintenance: 'maintenance',
}

export function generateBodyWeightFeedback(trend, rating, goal) {
  if (!trend?.hasEnoughData) {
    return 'Add at least two Body Weight values on different days before generating a trend analysis.'
  }

  const pace = formatSignedNumber(trend.weeklyChangePercent) + '% per week'
  const change = formatSignedNumber(trend.change) + ' kg'
  const goalLabel = GOAL_LABELS[goal] ?? 'your goal'
  let feedback = 'Your weight changed by ' + change + ' over '
    + trend.periodDays + ' days, an estimated pace of ' + pace + '.'

  if (rating.level === 'great') {
    feedback += ' This direction and pace are aligned with ' + goalLabel + '.'
  } else if (rating.level === 'average') {
    feedback += ' The direction is close to ' + goalLabel + ', but the pace could be more consistent.'
  } else if (rating.label === 'Wrong direction') {
    feedback += ' The recent direction is opposite to what is normally expected for ' + goalLabel + '.'
  } else {
    feedback += ' The pace is outside the simple target range used for ' + goalLabel + '.'
  }

  if (trend.periodDays < 14) {
    feedback += ' Treat this as an early signal because the recorded period is still short.'
  }

  return feedback
}

function formatSignedNumber(value) {
  const rounded = Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })
  return value > 0 ? '+' + rounded : rounded
}
