export function resolveMuscleIcon(name, iconId) {
  if (iconId === '' || iconId === 'abs') return iconId
  return String(name ?? '').trim().toLowerCase() === 'abs' ? 'abs' : ''
}
