<script setup>
import { computed, watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'
import { androidColorToCss } from '../../../shared/utils/colors'
import { exerciseMeta } from '../exerciseFormatters'
import { useExerciseEditor } from '../composables/useExerciseEditor'

const props = defineProps({
  open: { type: Boolean, required: true },
  date: { type: String, required: true },
  dateLabel: { type: String, required: true },
  exercise: { type: Object, default: null },
})

const emit = defineEmits(['close', 'data-changed'])
const selectedDate = computed(() => props.date)

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
  openEditor,
  removeExercise,
  removeSet,
  reset,
  save,
  startEditor,
  startPicker,
} = useExerciseEditor(selectedDate, {
  onChanged: (summary) => emit('data-changed', summary),
  onClose: () => close(true),
})

watch(() => props.open, (open) => {
  if (!open) return
  if (props.exercise) void startEditor(props.exercise)
  else void startPicker()
})

function close(force = false) {
  if (!force && saving.value) return
  reset()
  emit('close')
}

function categoryStyle(category) {
  return { '--category-color': androidColorToCss(category?.colour) }
}

function exerciseStyle(exercise) {
  return { '--category-color': androidColorToCss(exercise?.categoryColor) }
}
</script>

<template>
  <BaseModal :open="open" :aria-label="step === 'exercise' ? 'Choose exercise' : title" @close="close">
    <template v-if="step === 'exercise'">
      <header class="modal-header">
        <button class="modal-icon-button" type="button" aria-label="Close" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </button>
        <div class="modal-heading">
          <p>{{ dateLabel }}</p>
          <h2>Choose exercise</h2>
        </div>
        <span class="modal-header-spacer" aria-hidden="true"></span>
      </header>

      <div class="exercise-picker-controls">
        <label class="search-field">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input v-model="searchQuery" type="search" placeholder="Search exercises" autocomplete="off" />
        </label>

        <div class="category-strip" aria-label="Exercise categories">
          <button
            class="category-chip"
            :class="{ 'is-selected': selectedCategoryId === null }"
            type="button"
            @click="selectedCategoryId = null"
          >
            All
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-chip"
            :class="{ 'is-selected': selectedCategoryId === category.id }"
            :style="categoryStyle(category)"
            type="button"
            @click="selectedCategoryId = selectedCategoryId === category.id ? null : category.id"
          >
            <span class="category-dot"></span>
            {{ category.name }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="modal-list-status">Loading exercises…</div>
      <div v-else-if="!filteredExercises.length" class="modal-list-status">No exercises available yet.</div>

      <div v-else class="exercise-picker-list">
        <button
          v-for="item in filteredExercises"
          :key="item.id"
          class="exercise-picker-row"
          :style="exerciseStyle(item)"
          type="button"
          @click="openEditor(item)"
        >
          <span class="exercise-color-dot"></span>
          <span class="exercise-picker-copy">
            <strong>{{ item.name }}</strong>
            <small>{{ item.categoryName }} · {{ exerciseMeta(item) }}</small>
          </span>
          <span class="exercise-chevron">›</span>
        </button>
      </div>
    </template>

    <template v-else>
      <header class="modal-header">
        <button class="modal-icon-button" type="button" aria-label="Close" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </button>
        <div class="modal-heading">
          <p>{{ dateLabel }}</p>
          <h2>{{ title }}</h2>
        </div>
        <span class="modal-header-spacer" aria-hidden="true"></span>
      </header>

      <div v-if="selectedExercise" class="set-editor">
        <div class="selected-exercise-card" :style="exerciseStyle(selectedExercise)">
          <span class="exercise-color-dot"></span>
          <div>
            <strong>{{ selectedExercise.name }}</strong>
            <small>{{ selectedExercise.categoryName }}</small>
          </div>
        </div>

        <div class="sets-grid sets-grid-header" aria-hidden="true">
          <span>Set</span>
          <span>kg</span>
          <span>Reps</span>
          <span></span>
        </div>

        <div class="sets-editor-list">
          <div v-for="(set, index) in draftSets" :key="index" class="sets-grid set-input-row">
            <span class="set-number">{{ index + 1 }}</span>
            <input v-model="set.weight" class="set-input" type="text" inputmode="decimal" placeholder="0" aria-label="Weight in kilograms" @input="deleteConfirming = false" />
            <input v-model="set.reps" class="set-input" type="number" inputmode="numeric" min="1" step="1" placeholder="0" aria-label="Repetitions" @input="deleteConfirming = false" />
            <button class="remove-set-button" type="button" aria-label="Remove set" @click="removeSet(index)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
            </button>
          </div>
        </div>

        <button class="add-set-button" type="button" @click="addSet">
          <span>+</span>
          Add set
        </button>

        <p v-if="error" class="editor-error">{{ error }}</p>

        <div class="editor-actions">
          <button
            v-if="hasExistingSets"
            class="delete-exercise-button"
            :class="{ 'is-confirming': deleteConfirming }"
            type="button"
            :disabled="saving"
            @click="removeExercise"
          >
            {{ deleteConfirming ? 'Tap again to delete' : 'Delete exercise' }}
          </button>

          <button class="save-workout-button" type="button" :disabled="saving || !canSave" @click="save">
            {{ saving ? 'Saving…' : hasExistingSets ? 'Save changes' : 'Save exercise' }}
          </button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>
