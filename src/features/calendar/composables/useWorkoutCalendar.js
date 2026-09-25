import { computed, ref } from 'vue'
import { getWorkoutCalendarColors } from '../../../data/repositories/workoutRepository'
import { createCalendarMonths, monthKey } from '../calendarUtils'

export function useWorkoutCalendar() {
  const workoutColors = ref(new Map())

  const workoutDates = computed(() => new Set(workoutColors.value.keys()))
  const months = computed(() => createCalendarMonths(workoutDates.value))
  const currentMonthKey = computed(() => {
    const now = new Date()
    return monthKey(now.getFullYear(), now.getMonth())
  })

  async function loadWorkoutCalendar() {
    workoutColors.value = await getWorkoutCalendarColors()
  }

  return {
    currentMonthKey,
    loadWorkoutCalendar,
    months,
    workoutColors,
    workoutDates,
  }
}
