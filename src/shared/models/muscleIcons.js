export const BODY_ICON_IDS = ['body-fat', 'muscle-mass', 'body-weight', 'height', 'neck', 'waist-normal', 'waist-vacuum', 'visceral-fat']
const MUSCLE_ICONS = new Set(['abs', 'lats', 'glutes', 'biceps', 'side-delts', 'chest', 'adductors', 'triceps', 'front-delts', 'rear-delts', 'traps', 'hamstrings', 'calfs', 'quads', 'forearm', ...BODY_ICON_IDS])

export function resolveMuscleIcon(name, iconId) {
  if (iconId === '' || MUSCLE_ICONS.has(iconId)) return iconId
  const normalized = String(name ?? '').trim().toLowerCase().replace(/\s+/g, '-')
  return MUSCLE_ICONS.has(normalized) ? normalized : ''
}
