export function dateToKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function timeToKey(date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

export function normalizeDateKey(value) {
  const dateKey = String(value ?? '').trim()
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return dateToKey(date) === dateKey ? dateKey : null
}

export function normalizeTimeKey(value) {
  const timeKey = String(value ?? '').trim()
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(timeKey)
  if (!match) return null
  return `${match[1]}:${match[2]}:${match[3] ?? '00'}`
}

export function todayKey() {
  return dateToKey(new Date())
}

export function shiftDateKey(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + amount)
  return dateToKey(date)
}

export function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

export function relativeDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const [todayYear, todayMonth, todayDay] = todayKey().split('-').map(Number)
  const today = new Date(todayYear, todayMonth - 1, todayDay)
  const days = Math.round((today - target) / 86400000)

  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days > 1 && days < 30) return `${days} days ago`
  if (days >= 30 && days < 365) {
    const months = Math.max(1, Math.round(days / 30))
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  if (days >= 365) {
    const years = Math.max(1, Math.round(days / 365))
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  }
  return formatDate(dateKey)
}
