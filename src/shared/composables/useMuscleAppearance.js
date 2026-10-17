import { readonly, ref } from 'vue'

const ICONS_KEY = 'fitnotes-viewer-muscle-icons'
const HOME_KEY = 'fitnotes-viewer-home-muscle-indicators'
const iconsEnabled = ref(readPreference(ICONS_KEY))
const homeIndicatorsEnabled = ref(readPreference(HOME_KEY))

export function useMuscleAppearance() {
  return {
    iconsEnabled: readonly(iconsEnabled),
    homeIndicatorsEnabled: readonly(homeIndicatorsEnabled),
    setIconsEnabled,
    setHomeIndicatorsEnabled,
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
