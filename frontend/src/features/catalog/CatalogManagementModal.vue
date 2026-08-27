<script setup>
import { computed, watch } from 'vue'
import BaseModal from '../../shared/components/BaseModal.vue'
import CatalogItemList from '../workouts/components/CatalogItemList.vue'
import ExerciseDetailsEditor from '../workouts/components/ExerciseDetailsEditor.vue'
import MuscleDetailsEditor from '../workouts/components/MuscleDetailsEditor.vue'
import { useCatalogManager } from '../workouts/composables/useCatalogManager'

const props = defineProps({
  mode: { type: String, default: 'muscles' },
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['close'])
const manager = useCatalogManager()
const title = computed(readTitle)

watch(readOpenState, handleOpenState, { immediate: true })

function readOpenState() {
  return [props.open, props.mode]
}

function handleOpenState(state) {
  if (state[0]) void manager.open(state[1])
}

function readTitle() {
  return manager.title.value
}

function goBack() {
  if (manager.saving.value) return
  if (manager.goBack()) return
  manager.reset()
  emit('close')
}
</script>

<template>
  <BaseModal :open="open" :aria-label="title" @close="goBack">
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Back" @click="goBack">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
      <div class="modal-heading">
        <h2>{{ title }}</h2>
      </div>
      <span class="modal-header-spacer"></span>
    </header>

    <CatalogItemList
      v-if="manager.page.value === 'list'"
      v-model:search-query="manager.searchQuery.value"
      :items="manager.filteredItems.value"
      :loading="manager.loading.value"
      :mode="manager.mode.value"
      @select="manager.select"
    />
    <MuscleDetailsEditor
      v-else-if="manager.mode.value === 'muscles' && manager.selectedItem.value"
      :muscle="manager.selectedItem.value"
      :error="manager.error.value"
      :saving="manager.saving.value"
      @save="manager.saveMuscle"
    />
    <ExerciseDetailsEditor
      v-else-if="manager.selectedItem.value"
      :categories="manager.categories.value"
      :exercise="manager.selectedItem.value"
      :error="manager.error.value"
      :saving="manager.saving.value"
      @save="manager.saveExercise"
    />
  </BaseModal>
</template>
