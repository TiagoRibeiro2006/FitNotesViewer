const MUSCLE_ICONS = new Set(['abs', 'lats', 'glutes', 'biceps', 'side-delts', 'chest', 'adductors', 'triceps', 'front-delts', 'rear-delts', 'traps', 'hamstrings', 'calfs', 'quads', 'forearm'])

export function resolveMuscleIcon(name, iconId) {
  if (iconId === '' || MUSCLE_ICONS.has(iconId)) return iconId
  const normalized = String(name ?? '').trim().toLowerCase().replace(/\s+/g, '-')
  return MUSCLE_ICONS.has(normalized) ? normalized : ''
}
