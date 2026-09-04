const MINIMUM_WEEKLY_FREQUENCY = 2

export function evaluateBodyRegionBalance(regions, periodDays = 7) {
  const upperFrequency = readFrequency(regions?.upper)
  const lowerFrequency = readFrequency(regions?.lower)

  if (!upperFrequency && !lowerFrequency) {
    return createBalance('missing-both', upperFrequency, lowerFrequency, 0)
  }
  if (!upperFrequency) {
    return createBalance('missing-upper', upperFrequency, lowerFrequency, 0)
  }
  if (!lowerFrequency) {
    return createBalance('missing-lower', upperFrequency, lowerFrequency, 0)
  }

  const ratio = Math.min(upperFrequency, lowerFrequency)
    / Math.max(upperFrequency, lowerFrequency)

  if (hasSufficientWeeklyFrequency(upperFrequency, lowerFrequency, periodDays)) {
    return createBalance('balanced', upperFrequency, lowerFrequency, ratio)
  }

  if (ratio <= 0.5) {
    return createBalance('unbalanced', upperFrequency, lowerFrequency, ratio)
  }
  if (ratio < 0.75) {
    return createBalance('uneven', upperFrequency, lowerFrequency, ratio)
  }
  return createBalance('balanced', upperFrequency, lowerFrequency, ratio)
}

function hasSufficientWeeklyFrequency(upperFrequency, lowerFrequency, periodDays) {
  const weeks = calculateWeeks(periodDays)
  const upperFrequencyPerWeek = upperFrequency / weeks
  const lowerFrequencyPerWeek = lowerFrequency / weeks

  return upperFrequencyPerWeek >= MINIMUM_WEEKLY_FREQUENCY
    && lowerFrequencyPerWeek >= MINIMUM_WEEKLY_FREQUENCY
}

function calculateWeeks(periodDays) {
  const days = Number(periodDays)
  if (!Number.isFinite(days) || days <= 7) return 1
  return days / 7
}

function readFrequency(region) {
  const frequency = Number(region?.frequency)
  return Number.isFinite(frequency) && frequency > 0 ? frequency : 0
}

function createBalance(status, upperFrequency, lowerFrequency, ratio) {
  return { status, upperFrequency, lowerFrequency, ratio }
}
