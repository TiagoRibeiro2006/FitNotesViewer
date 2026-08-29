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
  managementSaving,
  removeMeasurement,
  sections,
  load,
  toggleFavorite,
} = useBodyTracker()

const selectedItem = ref(null)
const managing = ref(false)

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

function toggleManaging() {
  managing.value = !managing.value
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
    <AppSectionHeader title="Body Tracker">
      <template #action>
        <button
          class="body-manage-toggle"
          :class="{ 'is-active': managing }"
          type="button"
          :aria-pressed="managing"
          aria-label="Manage body measurements"
          @click="toggleManaging"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 16.5-.7 4.2 4.2-.7L18.8 8.7l-3.5-3.5L4 16.5Z" />
            <path d="m13.8 6.7 3.5 3.5" />
          </svg>
        </button>
      </template>
    </AppSectionHeader>

    <div v-if="loading" class="body-status">Loading body data…</div>
    <p v-else-if="error" class="body-error">{{ error }}</p>
    <BodyMeasurementList
      v-else
      :sections="sections"
      :managing="managing"
      :management-saving="managementSaving"
      @delete-measurement="removeMeasurement"
      :favorites-saving="favoritesSaving"
      @open-measurement="openMeasurement"
      @toggle-favorite="toggleFavorite"
    />
  </template>
</template>
