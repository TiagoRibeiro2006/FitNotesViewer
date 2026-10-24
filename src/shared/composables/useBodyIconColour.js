import { computed, readonly, ref } from 'vue'
import { useAccentColour } from './useAccentColour.js'
import { normalizeBodyIconColour, readBodyIconColour, resolveBodyIconColour, saveBodyIconColour } from '../models/bodyIconColours.js'

function bodyColourStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

const preference = ref(readBodyIconColour(bodyColourStorage()))
const { accentColour } = useAccentColour()
const bodyIconColour = computed(readColour)

function readColour() {
  return resolveBodyIconColour(preference.value, accentColour.value)
}

function setBodyIconColour(mode, customColour = preference.value.customColour) {
  preference.value = normalizeBodyIconColour({ mode, customColour })
  saveBodyIconColour(bodyColourStorage(), preference.value)
}

export function useBodyIconColour() {
  return { bodyIconColour, preference: readonly(preference), setBodyIconColour }
}
