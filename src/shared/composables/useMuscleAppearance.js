import { readonly, ref } from 'vue'

const ICONS_KEY = 'fitnotes-viewer-muscle-icons'
const HOME_KEY = 'fitnotes-viewer-home-muscle-indicators'
const BODY_KEY = 'fitnotes-viewer-body-icons'
const CHARTS_KEY = 'fitnotes-viewer-charts-icons'
const iconsEnabled = ref(readPreference(ICONS_KEY))
const homeIndicatorsEnabled = ref(readPreference(HOME_KEY))
const bodyIconsEnabled = ref(readPreference(BODY_KEY))
const chartIconsEnabled = ref(readPreference(CHARTS_KEY, iconsEnabled.value))

export function useMuscleAppearance() {
  return {
    iconsEnabled: readonly(iconsEnabled),
    homeIndicatorsEnabled: readonly(homeIndicatorsEnabled),
    bodyIconsEnabled: readonly(bodyIconsEnabled),
    chartIconsEnabled: readonly(chartIconsEnabled),
    setIconsEnabled,
    setHomeIndicatorsEnabled,
    setBodyIconsEnabled,
    setChartIconsEnabled,
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

function setChartIconsEnabled(enabled) {
  chartIconsEnabled.value = enabled
  savePreference(CHARTS_KEY, enabled)
}

function readPreference(key, fallback = true) {
  try {
    const value = globalThis.localStorage?.getItem(key)
    return value === null || value === undefined ? fallback : value !== 'false'
  } catch {
    return fallback
  }
}

function savePreference(key, enabled) {
  try {
    globalThis.localStorage?.setItem(key, String(enabled))
  } catch {}
}
