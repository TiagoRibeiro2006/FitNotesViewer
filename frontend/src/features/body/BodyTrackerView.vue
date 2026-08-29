<script setup>
import { nextTick, onMounted, ref } from 'vue'
import AppSectionHeader from '../../shared/components/AppSectionHeader.vue'
import BodyMeasurementDetailView from './components/BodyMeasurementDetailView.vue'
import BodyMeasurementList from './components/BodyMeasurementList.vue'
import { useBodyTracker } from './composables/useBodyTracker'

const {
  error,
  favoritesSaving,
  loading,
  sections,
  load,
  toggleFavorite,
} = useBodyTracker()

const selectedItem = ref(null)

onMounted(async () => {
  await load()
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
})

async function openMeasurement(item) {
  selectedItem.value = item
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

async function closeMeasurement() {
  selectedItem.value = null
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
}
</script>

<template>
  <BodyMeasurementDetailView
    v-if="selectedItem"
    :item="selectedItem"
    @close="closeMeasurement"
    @changed="load"
  />
  <template v-else>
    <AppSectionHeader title="Body Tracker" />

    <div v-if="loading" class="body-status">Loading body data…</div>
    <p v-else-if="error" class="body-error">{{ error }}</p>
    <BodyMeasurementList
      v-else
      :sections="sections"
      :favorites-saving="favoritesSaving"
      @open-measurement="openMeasurement"
      @toggle-favorite="toggleFavorite"
    />
  </template>
</template>
