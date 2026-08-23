import { formatDate } from '../../shared/utils/dates'
import { formatNumber } from '../../shared/utils/numbers'

export function formatBodyValue(item) {
  if (item.value === null) return 'No data yet'
  const separator = item.unit === '%' ? '' : ' '
  return `${formatNumber(item.value)}${separator}${item.unit}`
}

export function formatBodyEntryDate(item) {
  if (!item.date) return ''
  const date = formatDate(item.date)
  if (!item.time) return date
  return `${date} at ${String(item.time).slice(0, 5)}`
}
