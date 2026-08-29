<script setup>
import { onMounted, ref } from 'vue'
import CatalogManagementModal from '../catalog/CatalogManagementModal.vue'
import SettingsDataSection from './components/SettingsDataSection.vue'
import SettingsManagementSection from './components/SettingsManagementSection.vue'

defineProps({
  summary: { type: Object, required: true },
})

const emit = defineEmits(['data-imported', 'data-deleted', 'manage-body-items'])
const catalogMode = ref('muscles')
const catalogOpen = ref(false)

onMounted(scrollToTop)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function openCatalog(mode) {
  catalogMode.value = mode
  catalogOpen.value = true
}

function openMuscles() {
  openCatalog('muscles')
}

function openExercises() {
  openCatalog('exercises')
}

function openBodyItems() {
  emit('manage-body-items')
}

function closeCatalog() {
  catalogOpen.value = false
}

function dataImported(summary) {
  emit('data-imported', summary)
}

function dataDeleted() {
  emit('data-deleted')
}
</script>

<template>
  <div class="settings-sections">
    <SettingsManagementSection
      @manage-muscles="openMuscles"
      @manage-exercises="openExercises"
      @manage-body-items="openBodyItems"
    />

    <SettingsDataSection
      :summary="summary"
      @data-imported="dataImported"
      @data-deleted="dataDeleted"
    />
  </div>

  <CatalogManagementModal
    :open="catalogOpen"
    :mode="catalogMode"
    @close="closeCatalog"
  />
</template>
