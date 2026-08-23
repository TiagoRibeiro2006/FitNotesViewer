<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { friendlyError } from '../../shared/utils/errors'
import BodyMeasurementList from './components/BodyMeasurementList.vue'
import BodyValueModal from './components/BodyValueModal.vue'
import { useBodyTracker } from './composables/useBodyTracker'

const {
  error,
  favoritesSaving,
  loading,
  sections,
  valueSaving,
  load,
  saveValue,
  toggleFavorite,
} = useBodyTracker()

const modalOpen = ref(false)
const selectedItem = ref(null)
const modalError = ref('')

onMounted(async () => {
  await load()
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
})

function openValueModal(item) {
  selectedItem.value = item
  modalError.value = ''
  modalOpen.value = true
}

function closeValueModal() {
  if (valueSaving.value) return
  modalOpen.value = false
  selectedItem.value = null
  modalError.value = ''
}

async function submitValue(value) {
  if (!selectedItem.value) return
  modalError.value = ''

  try {
    if (await saveValue(selectedItem.value, value)) closeValueModal()
  } catch (saveError) {
    modalError.value = friendlyError(saveError)
  }
}
</script>

<template>
  <header class="app-header body-header">
    <div>
      <p class="eyebrow">BODY</p>
      <h1>Body Tracker</h1>
    </div>
  </header>

  <div v-if="loading" class="body-status">Loading body data…</div>
  <p v-else-if="error" class="body-error">{{ error }}</p>
  <BodyMeasurementList
    v-else
    :sections="sections"
    :favorites-saving="favoritesSaving"
    @add-value="openValueModal"
    @toggle-favorite="toggleFavorite"
  />

  <BodyValueModal
    :open="modalOpen"
    :item="selectedItem"
    :saving="valueSaving"
    :error="modalError"
    @close="closeValueModal"
    @save="submitValue"
  />
</template>
