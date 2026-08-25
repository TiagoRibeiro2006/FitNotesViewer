export function createBackupFileName(date = new Date()) {
  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map((part) => String(part).padStart(2, '0'))

  return `FitNotes_Backup_${parts.join('_')}.fitnotes`
}
