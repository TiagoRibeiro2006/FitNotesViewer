import { readonly, ref } from 'vue'

const ICONS_KEY = 'fitnotes-viewer-muscle-icons'
const iconsEnabled = ref(readPreference(ICONS_KEY))

export function useMuscleAppearance() {
  return { iconsEnabled: readonly(iconsEnabled), setIconsEnabled }
}

function setIconsEnabled(enabled) {
  iconsEnabled.value = enabled
  savePreference(ICONS_KEY, enabled)
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
