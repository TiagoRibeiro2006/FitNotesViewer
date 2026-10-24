import { readonly, ref } from 'vue'
import { ACCENT_COLOURS, applyAccentColour, normalizeAccentColour, readAccentColour, saveAccentColour } from '../models/accentColours.js'

function accentStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

const accentColour = ref(readAccentColour(accentStorage()))

export function initializeAccentColour() {
  applyAccentColour(globalThis.document, accentColour.value)
}

function setAccentColour(value) {
  accentColour.value = normalizeAccentColour(value)
  saveAccentColour(accentStorage(), accentColour.value)
  initializeAccentColour()
}

export function useAccentColour() {
  return { accentColour: readonly(accentColour), colours: ACCENT_COLOURS, setAccentColour }
}
