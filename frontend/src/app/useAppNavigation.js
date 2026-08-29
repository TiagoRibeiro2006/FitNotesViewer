import { nextTick, ref } from 'vue'
import { todayKey } from '../shared/utils/dates'

const DEFAULT_VIEW = 'workouts'
const APP_VIEWS = new Set(['workouts', 'body', 'calendar', 'settings'])

export function useAppNavigation() {
  const activeView = ref(DEFAULT_VIEW)
  const selectedDate = ref(todayKey())

  function scrollToTop() {
    void nextTick(moveWindowToTop)
  }

  function moveWindowToTop() {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function navigateTo(view) {
    activeView.value = APP_VIEWS.has(view) ? view : DEFAULT_VIEW

    if (activeView.value !== 'calendar') scrollToTop()
  }

  function selectCalendarDate(dateKey) {
    selectedDate.value = dateKey
    activeView.value = DEFAULT_VIEW
    scrollToTop()
  }

  function resetSelectedDate() {
    selectedDate.value = todayKey()
  }

  return {
    activeView,
    selectedDate,
    navigateTo,
    resetSelectedDate,
    selectCalendarDate,
  }
}
