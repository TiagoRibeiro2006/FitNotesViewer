export const ACCENT_STORAGE_KEY = 'fitnotes-viewer-accent-colour'
export const DEFAULT_ACCENT = '#4b9cff'
export const ACCENT_COLOURS = [
  { name: 'Blue', colour: DEFAULT_ACCENT },
  { name: 'Purple', colour: '#a487ff' },
  { name: 'Pink', colour: '#ed78ae' },
  { name: 'Coral', colour: '#f08072' },
  { name: 'Amber', colour: '#e8ad45' },
  { name: 'Green', colour: '#55bd8c' },
  { name: 'Teal', colour: '#4cbfc0' },
]

export function normalizeAccentColour(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_ACCENT
}

export function readAccentColour(storage) {
  try {
    return normalizeAccentColour(storage?.getItem(ACCENT_STORAGE_KEY))
  } catch {
    return DEFAULT_ACCENT
  }
}

export function saveAccentColour(storage, value) {
  try {
    storage?.setItem(ACCENT_STORAGE_KEY, normalizeAccentColour(value))
  } catch {}
}

function channels(colour) {
  return [parseInt(colour.slice(1, 3), 16), parseInt(colour.slice(3, 5), 16), parseInt(colour.slice(5, 7), 16)]
}

function luminance(rgb) {
  let result = 0
  const weights = [.2126, .7152, .0722]
  for (let index = 0; index < 3; index += 1) {
    const value = rgb[index] / 255
    result += (value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4) * weights[index]
  }
  return result
}

export function accentTextColour(colour, lightTheme) {
  const original = channels(normalizeAccentColour(colour))
  const surface = lightTheme ? .94 : .006
  for (let step = 0; step <= 20; step += 1) {
    const result = []
    for (const channel of original) result.push(Math.round(channel + ((lightTheme ? 0 : 255) - channel) * step / 20))
    const value = luminance(result)
    const contrast = (Math.max(value, surface) + .05) / (Math.min(value, surface) + .05)
    if (contrast >= 4.5) return '#' + result[0].toString(16).padStart(2, '0') + result[1].toString(16).padStart(2, '0') + result[2].toString(16).padStart(2, '0')
  }
  return lightTheme ? '#000000' : '#ffffff'
}

export function applyAccentColour(document, value) {
  if (!document) return
  const colour = normalizeAccentColour(value)
  const root = document.documentElement
  const lightTheme = root.dataset.theme === 'light' || root.dataset.theme === 'soft'
  const surface = root.dataset.theme === 'soft' ? '#faf8ff' : lightTheme ? '#ffffff' : '#101010'
  root.style.setProperty('--accent-colour', colour)
  root.style.setProperty('--accent-ink', accentTextColour(colour, lightTheme))
  root.style.setProperty('--accent-rgb', channels(colour).join(', '))
  root.style.setProperty('--accent-on-colour', luminance(channels(colour)) > .179 ? '#101010' : '#ffffff')
  root.style.setProperty('--theme-accent-surface', `color-mix(in srgb, ${colour} 12%, ${surface})`)
  root.style.setProperty('--theme-accent-border', `color-mix(in srgb, ${colour} 45%, ${surface})`)
}
