import { dateToKey, todayKey } from '../../shared/utils/dates'

export function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export function createCalendarMonths(workoutDates) {
  const months = []
  const firstWorkoutDate = [...workoutDates].sort()[0] ?? todayKey()
  const [firstYear, firstMonth] = firstWorkoutDate.split('-').map(Number)
  const cursor = new Date(firstYear, firstMonth - 1, 1)
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  while (cursor <= end) {
    months.push(buildCalendarMonth(cursor.getFullYear(), cursor.getMonth()))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

export function buildCalendarMonth(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leadingBlankDays = (firstDay.getDay() + 6) % 7
  const days = []

  for (let index = 0; index < leadingBlankDays; index += 1) {
    days.push({ key: `blank-${year}-${monthIndex}-${index}`, blank: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ key: dateToKey(new Date(year, monthIndex, day)), blank: false, day })
  }

  return {
    key: monthKey(year, monthIndex),
    label: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(firstDay),
    days,
  }
}

export function isToday(dateKey) {
  return dateKey === todayKey()
}
