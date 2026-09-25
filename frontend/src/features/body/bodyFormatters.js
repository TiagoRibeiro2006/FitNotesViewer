import { formatDate } from '../../shared/utils/dates'
import { formatNumber } from '../../shared/utils/numbers'
import {
  displayMeasurementUnit,
  displayMeasurementValue,
} from '../../shared/units/weightUnits'

export function formatBodyValue(item, weightUnit) {
  if (item.value === null) return 'No data yet'
  const value = displayMeasurementValue(item.value, item.unit, weightUnit)
  const unit = displayMeasurementUnit(item.unit, weightUnit)
  const separator = unit === '%' ? '' : ' '
  return `${formatNumber(value)}${separator}${unit}`
}

export function formatBodyEntryDate(item) {
  if (!item.date) return ''
  const date = formatDate(item.date)
  if (!item.time) return date
  return `${date} at ${String(item.time).slice(0, 5)}`
}
