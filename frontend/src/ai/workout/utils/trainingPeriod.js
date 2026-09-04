export function calculatePeriodWeeks(periodDays) {
  const days = Number(periodDays)
  if (!Number.isFinite(days) || days <= 7) return 1
  return days / 7
}
