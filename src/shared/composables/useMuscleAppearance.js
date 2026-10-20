import { readonly, ref } from 'vue'

const ICONS_KEY = 'fitnotes-viewer-muscle-icons'
const HOME_KEY = 'fitnotes-viewer-home-muscle-indicators'
const BODY_KEY = 'fitnotes-viewer-body-icons'
const iconsEnabled = ref(readPreference(ICONS_KEY))
const homeIndicatorsEnabled = ref(readPreference(HOME_KEY))
const bodyIconsEnabled = ref(readPreference(BODY_KEY))

export function useMuscleAppearance() {
  return {
    iconsEnabled: readonly(iconsEnabled),
    homeIndicatorsEnabled: readonly(homeIndicatorsEnabled),
    bodyIconsEnabled: readonly(bodyIconsEnabled),
    setIconsEnabled,
    setHomeIndicatorsEnabled,
    setBodyIconsEnabled,
  }
}

function setIconsEnabled(enabled) {
  iconsEnabled.value = enabled
  savePreference(ICONS_KEY, enabled)
}

function setHomeIndicatorsEnabled(enabled) {
  homeIndicatorsEnabled.value = enabled
  savePreference(HOME_KEY, enabled)
}

function setBodyIconsEnabled(enabled) {
  bodyIconsEnabled.value = enabled
  savePreference(BODY_KEY, enabled)
}

function readPreference(key) {
  try {
    return globalThis.localStorage?.getItem(key) !== 'false'
  } catch {
    return true
  }
}

function savePreference(key, enabled) {
  try {
    globalThis.localStorage?.setItem(key, String(enabled))
  } catch {}
}
