import { DEFAULT_ACCENT, normalizeAccentColour } from './accentColours.js'

export const BODY_ICON_COLOUR_KEY = 'fitnotes-viewer-body-icon-colour'

export function normalizeBodyIconColour(value) {
  return {
    mode: value?.mode === 'custom' ? 'custom' : 'accent',
    customColour: normalizeAccentColour(value?.customColour),
  }
}

export function readBodyIconColour(storage) {
  try {
    return normalizeBodyIconColour(JSON.parse(storage?.getItem(BODY_ICON_COLOUR_KEY) ?? 'null'))
  } catch {
    return { mode: 'accent', customColour: DEFAULT_ACCENT }
  }
}

export function saveBodyIconColour(storage, value) {
  try {
    storage?.setItem(BODY_ICON_COLOUR_KEY, JSON.stringify(normalizeBodyIconColour(value)))
  } catch {}
}

export function resolveBodyIconColour(preference, accent) {
  const value = normalizeBodyIconColour(preference)
  return value.mode === 'custom' ? value.customColour : normalizeAccentColour(accent)
}
