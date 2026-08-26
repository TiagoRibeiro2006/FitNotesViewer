<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'
import { useExerciseEditor } from '../composables/useExerciseEditor'
import ExercisePicker from './ExercisePicker.vue'
import ExerciseOptionsMenu from './ExerciseOptionsMenu.vue'
import ExerciseSetEditor from './ExerciseSetEditor.vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  date: { type: String, required: true },
  dateLabel: { type: String, required: true },
  exercise: { type: Object, default: null },
})

const emit = defineEmits(['close', 'data-changed'])
const selectedOption = ref('')
const callbacks = {
  onChanged: notifyDataChanged,
  onClose: closeAfterSave,
}
const selectedDate = computed(readSelectedDate)

const {
  canSave,
  categories,
  deleteConfirming,
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
  removeExercise,
  removeSet,
  reset,
  save,
  startEditor,
  startPicker,
  updateSet,
} = useExerciseEditor(selectedDate, callbacks)

watch(isModalOpen, handleOpenChange)

function readSelectedDate() {
  return props.date
}

function isModalOpen() {
  return props.open
}

function handleOpenChange(open) {
  if (!open) return
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
  selectedOption.value = ''
  reset()
  emit('close')
}

function selectOption(option) {
  selectedOption.value = selectedOption.value === option ? '' : option
}
</script>

<template>
  <BaseModal :open="open" :aria-label="step === 'exercise' ? 'Choose exercise' : title" @close="close">
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Close" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
      <div class="modal-heading">
        <p>{{ dateLabel }}</p>
        <h2>{{ step === 'exercise' ? 'Choose exercise' : title }}</h2>
      </div>
      <ExerciseOptionsMenu
        :mode="step"
        :selected-option="selectedOption"
        @select="selectOption"
      />
    </header>

    <ExercisePicker
      v-if="step === 'exercise'"
      v-model:search-query="searchQuery"
      v-model:selected-category-id="selectedCategoryId"
      :categories="categories"
      :exercises="filteredExercises"
      :loading="loading"
      @select="openEditor"
    />

    <ExerciseSetEditor
      v-else-if="selectedExercise"
      :exercise="selectedExercise"
      :sets="draftSets"
      :has-existing-sets="hasExistingSets"
      :delete-confirming="deleteConfirming"
      :saving="saving"
      :can-save="canSave"
      :error="error"
      :show-history="selectedOption === 'history'"
      @update-set="updateSet"
      @move-set="moveSet"
      @remove-set="removeSet"
      @add-set="addSet"
      @delete="removeExercise"
      @save="save"
    />
  </BaseModal>
</template>
