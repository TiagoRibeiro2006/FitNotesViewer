import { ref, watch } from 'vue'
import {
  createRecentDateInterval,
  normalizeSelectableDateInterval,
} from '../analytics/dateRanges.js'

const STORAGE_KEY = 'fitnotes-chart-date-interval'
const initialInterval = readInitialInterval()
const startDate = ref(initialInterval.startDate)
const endDate = ref(initialInterval.endDate)

watch([startDate, endDate], saveCurrentInterval, { flush: 'sync' })

export function useChartDateInterval() {
  return { startDate, endDate }
}

function readInitialInterval() {
  return readSavedInterval() ?? createRecentDateInterval(7)
}

function readSavedInterval() {
  if (typeof window === 'undefined') return null

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return normalizeSelectableDateInterval(saved?.startDate, saved?.endDate)
  } catch {
    return null
  }
}

function saveCurrentInterval() {
  if (typeof window === 'undefined') return

  const interval = normalizeSelectableDateInterval(startDate.value, endDate.value)
  if (!interval) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(interval))
  } catch {
    return
  }
}
