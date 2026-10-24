import { readonly, ref } from 'vue'

const HOME_KEY = 'fitnotes-viewer-home-progress-stars'
const EDITOR_KEY = 'fitnotes-viewer-editor-progress-stars'
const homeProgressEnabled = ref(readPreference(HOME_KEY))
const editorProgressEnabled = ref(readPreference(EDITOR_KEY))

function readPreference(key) {
  try {
    return globalThis.localStorage?.getItem(key) !== 'false'
  } catch {
    return true
  }
}

function savePreference(key, value) {
  try {
    globalThis.localStorage?.setItem(key, String(value))
  } catch {}
}

function setHomeProgressEnabled(value) {
  homeProgressEnabled.value = value
  savePreference(HOME_KEY, value)
}

function setEditorProgressEnabled(value) {
  editorProgressEnabled.value = value
  savePreference(EDITOR_KEY, value)
}

export function useProgressAppearance() {
  return {
    homeProgressEnabled: readonly(homeProgressEnabled),
    editorProgressEnabled: readonly(editorProgressEnabled),
    setHomeProgressEnabled,
    setEditorProgressEnabled,
  }
}
