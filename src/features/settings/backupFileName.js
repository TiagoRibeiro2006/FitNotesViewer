export function createBackupFileName(date = new Date()) {
  return `FitNotes_Backup_${createTimestamp(date)}.fitnotes`
}

export function createCsvFileName(date = new Date()) {
  return `FitNotes_Export_${createTimestamp(date)}.csv`
}

function createTimestamp(date) {
  const values = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ]
  const parts = []
  for (const value of values) parts.push(String(value).padStart(2, '0'))

  return parts.join('_')
}
