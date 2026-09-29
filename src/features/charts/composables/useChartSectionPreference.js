import { readonly, ref } from 'vue'

const STORAGE_KEY = 'fitnotes-viewer-chart-section'
const DEFAULT_SECTION = 'body'
const SECTIONS = new Set(['body', 'training'])
const activeSection = ref(readSavedSection())

export function useChartSectionPreference() {
  return {
    activeSection: readonly(activeSection),
    selectSection,
  }
}

function selectSection(section) {
  const normalized = normalizeSection(section)
  activeSection.value = normalized
  saveSection(normalized)
}

function readSavedSection() {
  if (!canUseLocalStorage()) return DEFAULT_SECTION

  try {
    return normalizeSection(localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_SECTION
  }
}

function saveSection(section) {
  if (!canUseLocalStorage()) return

  try {
    localStorage.setItem(STORAGE_KEY, section)
  } catch {
    // The in-memory preference still works when browser storage is unavailable.
  }
}

function normalizeSection(section) {
  return SECTIONS.has(section) ? section : DEFAULT_SECTION
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}
