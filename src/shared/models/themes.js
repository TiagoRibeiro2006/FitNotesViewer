export const THEME_STORAGE_KEY = 'fitnotes-viewer-theme'
export const THEMES = [
  { id: 'dark', label: 'Dark', description: 'The original look. Deep blacks and crisp contrast.' },
  { id: 'light', label: 'Light', description: 'Bright surfaces and clear, comfortable text.' },
  { id: 'soft', label: 'Soft', description: 'Soft-tech pastels with lavender and cool mist tones.' },
]

export function normalizeTheme(value) {
  for (const theme of THEMES) {
    if (theme.id === value) return value
  }
  return 'dark'
}

export function readTheme(storage) {
  try {
    return normalizeTheme(storage?.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'dark'
  }
}

export function saveTheme(storage, theme) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, normalizeTheme(theme))
  } catch {}
}

export function applyTheme(document, theme) {
  if (!document) return
  const selected = normalizeTheme(theme)
  document.documentElement.dataset.theme = selected
  const colour = selected === 'light' ? '#f5f7fa' : selected === 'soft' ? '#efedf7' : '#000000'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colour)
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', selected === 'dark' ? 'dark' : 'light')
}
