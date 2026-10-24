import { readonly, ref } from 'vue'
import { applyTheme, normalizeTheme, readTheme, saveTheme, THEMES } from '../models/themes.js'
import { initializeAccentColour } from './useAccentColour.js'

function themeStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

const selectedTheme = ref(readTheme(themeStorage()))

export function initializeTheme() {
  applyTheme(globalThis.document, selectedTheme.value)
  initializeAccentColour()
}

function setTheme(theme) {
  selectedTheme.value = normalizeTheme(theme)
  saveTheme(themeStorage(), selectedTheme.value)
  initializeTheme()
}

export function useTheme() {
  return { selectedTheme: readonly(selectedTheme), themes: THEMES, setTheme }
}
