<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'
import { useCatalogManager } from '../composables/useCatalogManager'
import { useExerciseEditor } from '../composables/useExerciseEditor'
import CatalogItemList from './CatalogItemList.vue'
import ExerciseDetailsEditor from './ExerciseDetailsEditor.vue'
import ExercisePicker from './ExercisePicker.vue'
import ExerciseOptionsMenu from './ExerciseOptionsMenu.vue'
import ExerciseSetEditor from './ExerciseSetEditor.vue'
import MuscleDetailsEditor from './MuscleDetailsEditor.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  date: { type: String, required: true },
  dateLabel: { type: String, required: true },
  exercise: { type: Object, default: null },
})

const emit = defineEmits(['close', 'data-changed'])
const catalogActive = ref(false)
const selectedOption = ref('')
const callbacks = {
  onChanged: notifyDataChanged,
  onClose: closeAfterSave,
}
const catalogManager = useCatalogManager(callbacks)
const selectedDate = computed(readSelectedDate)

const {
  canSave,
  categories,
  deleteConfirming,
  detailsError,
  detailsSaving,
  draftProgress,
  draftSets,
  error,
  filteredExercises,
  hasExistingSets,
  loading,
  saving,
  searchQuery,
  selectedCategoryId,
  selectedExercise,
  step,
  title,
  addSet,
  moveSet,
  openEditor,
  openExerciseDetails,
  removeExercise,
  removeSet,
  reset,
  returnToSets,
  save,
  saveExerciseDetails,
  startEditor,
  startPicker,
  updateSet,
} = useExerciseEditor(selectedDate, callbacks)

const modalTitle = computed(readModalTitle)

watch(isModalOpen, handleOpenChange)

function readSelectedDate() {
  return props.date
}

function isModalOpen() {
  return props.open
}

function readModalTitle() {
  if (catalogActive.value) return catalogManager.title.value
  if (step.value === 'exercise') return 'Choose exercise'
  if (step.value === 'exercise-details') return 'Exercise details'
  return title.value
}

function handleOpenChange(open) {
  if (!open) return
  catalogActive.value = false
  catalogManager.reset()
  selectedOption.value = ''
  if (props.exercise) {
    void startEditor(props.exercise)
    return
  }

  void startPicker()
}

function notifyDataChanged(summary) {
  emit('data-changed', summary)
}

function closeAfterSave() {
  close(true)
}

function close(force = false) {
  if (!force && saving.value) return
  catalogActive.value = false
  catalogManager.reset()
  selectedOption.value = ''
  reset()
  emit('close')
}

function goBack() {
  if (saving.value || detailsSaving.value || catalogManager.saving.value) return
  selectedOption.value = ''

  if (catalogActive.value) {
    if (catalogManager.goBack()) return
    catalogActive.value = false
    catalogManager.reset()
    void startPicker()
    return
  }

  if (step.value === 'exercise-details') {
    returnToSets()
    return
  }

  if (step.value === 'sets' && !props.exercise) {
    void startPicker()
    return
  }

  close()
}

function selectOption(option) {
  if (step.value === 'exercise' && (option === 'muscles' || option === 'exercises')) {
    selectedOption.value = ''
    catalogActive.value = true
    void catalogManager.open(option)
    return
  }

  selectedOption.value = selectedOption.value === option ? '' : option
}
</script>

<template>
  <BaseModal :open="open" :aria-label="modalTitle" @close="goBack">
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Back" @click="goBack">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
      <div class="modal-heading">
        <p>{{ dateLabel }}</p>
        <h2>{{ modalTitle }}</h2>
      </div>
      <ExerciseOptionsMenu
        v-if="!catalogActive && (step === 'exercise' || step === 'sets')"
        :mode="step"
        :selected-option="selectedOption"
        @select="selectOption"
      />
      <button
        v-else-if="catalogActive && catalogManager.page.value === 'list'"
        class="modal-icon-button catalog-add-button"
        type="button"
        :aria-label="catalogManager.mode.value === 'muscles' ? 'Add muscle' : 'Add exercise'"
        @click="catalogManager.startCreate"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <span v-else class="modal-header-spacer"></span>
    </header>

    <template v-if="catalogActive">
      <CatalogItemList
        v-if="catalogManager.page.value === 'list'"
        v-model:search-query="catalogManager.searchQuery.value"
        :items="catalogManager.filteredItems.value"
        :loading="catalogManager.loading.value"
        :mode="catalogManager.mode.value"
        @select="catalogManager.select"
      />
      <MuscleDetailsEditor
        v-else-if="catalogManager.mode.value === 'muscles' && catalogManager.selectedItem.value"
        :muscle="catalogManager.selectedItem.value"
        :creating="catalogManager.page.value === 'create'"
        :deleting="catalogManager.deleting.value"
        :exercise-count="catalogManager.selectedMuscleExerciseCount.value"
        :error="catalogManager.error.value"
        :saving="catalogManager.saving.value"
        @save="catalogManager.saveMuscle"
        @delete="catalogManager.removeMuscle"
      />
      <ExerciseDetailsEditor
        v-else-if="catalogManager.selectedItem.value"
        :categories="catalogManager.categories.value"
        :exercise="catalogManager.selectedItem.value"
        :creating="catalogManager.page.value === 'create'"
        :deleting="catalogManager.deleting.value"
        :deletable="catalogManager.page.value === 'details'"
        :error="catalogManager.error.value"
        :saving="catalogManager.saving.value"
        @save="catalogManager.saveExercise"
        @delete="catalogManager.removeExercise"
      />
    </template>

    <ExercisePicker
      v-else-if="step === 'exercise'"
      v-model:search-query="searchQuery"
      v-model:selected-category-id="selectedCategoryId"
      :categories="categories"
      :exercises="filteredExercises"
      :loading="loading"
      @select="openEditor"
    />

    <ExerciseDetailsEditor
      v-else-if="step === 'exercise-details' && selectedExercise"
      :categories="categories"
      :exercise="selectedExercise"
      :error="detailsError"
      :saving="detailsSaving"
      @save="saveExerciseDetails"
    />

    <ExerciseSetEditor
      v-else-if="step === 'sets' && selectedExercise"
      :exercise="selectedExercise"
      :sets="draftSets"
      :set-progress="draftProgress"
      :has-existing-sets="hasExistingSets"
      :delete-confirming="deleteConfirming"
      :saving="saving"
      :can-save="canSave"
      :error="error"
      :show-calculator="selectedOption === 'one-rep-max'"
      :show-history="selectedOption === 'history'"
      :show-records="selectedOption === 'records'"
      @update-set="updateSet"
      @move-set="moveSet"
      @remove-set="removeSet"
      @add-set="addSet"
      @delete="removeExercise"
      @edit-details="openExerciseDetails"
      @save="save"
    />
  </BaseModal>
</template>
