<script setup>
import { androidColorToCss } from '../../../shared/utils/colors'
import { useDragList } from '../../../shared/composables/useDragList'
import ExerciseHistoryPanel from './ExerciseHistoryPanel.vue'
import ExerciseRecordsPanel from './ExerciseRecordsPanel.vue'

defineProps({
  canSave: { type: Boolean, default: false },
  deleteConfirming: { type: Boolean, default: false },
  error: { type: String, default: '' },
  exercise: { type: Object, required: true },
  hasExistingSets: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  sets: { type: Array, required: true },
  showHistory: { type: Boolean, default: false },
  showRecords: { type: Boolean, default: false },
})

const emit = defineEmits([
  'add-set',
  'delete',
  'move-set',
  'remove-set',
  'save',
  'update-set',
])
const { draggingIndex, startDrag } = useDragList(moveSet)

function moveSet(fromIndex, toIndex) {
  emit('move-set', fromIndex, toIndex)
}

function updateSet(index, field, event) {
  emit('update-set', index, field, event.target.value)
}

function exerciseStyle(exercise) {
  return { '--category-color': androidColorToCss(exercise?.categoryColor) }
}
</script>

<template>
  <div class="set-editor" :class="{ 'has-details': showHistory || showRecords }">
    <div class="selected-exercise-card" :style="exerciseStyle(exercise)">
      <span class="exercise-color-dot"></span>
      <div>
        <strong>{{ exercise.name }}</strong>
        <small>{{ exercise.categoryName }}</small>
      </div>
    </div>

    <div class="sets-grid sets-grid-header" aria-hidden="true">
      <span>Set</span>
      <span>kg</span>
      <span>Reps</span>
      <span></span>
    </div>

    <div
      class="sets-editor-list"
      :class="{ 'is-reordering': draggingIndex >= 0 }"
      data-drag-list
    >
      <div
        v-for="(set, index) in sets"
        :key="set.draftId"
        class="sets-grid set-input-row"
        :class="{ 'is-dragging': draggingIndex === index }"
        data-drag-item
      >
        <button
          class="set-number set-drag-handle"
          type="button"
          :aria-label="`Move set ${index + 1}`"
          @contextmenu.prevent
          @pointerdown="startDrag($event, index, saving)"
        >
          {{ index + 1 }}
        </button>
        <input
          :value="set.weight"
          class="set-input"
          type="text"
          inputmode="decimal"
          placeholder="0"
          aria-label="Weight in kilograms"
          @input="updateSet(index, 'weight', $event)"
        />
        <input
          :value="set.reps"
          class="set-input"
          type="number"
          inputmode="numeric"
          min="1"
          step="1"
          placeholder="0"
          aria-label="Repetitions"
          @input="updateSet(index, 'reps', $event)"
        />
        <button class="remove-set-button" type="button" aria-label="Remove set" @click="emit('remove-set', index)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 7 10 10M17 7 7 17" />
          </svg>
        </button>
      </div>
    </div>

    <button class="add-set-button" type="button" @click="emit('add-set')">
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
        @click="emit('delete')"
      >
        {{ deleteConfirming ? 'Tap again to delete' : 'Delete exercise' }}
      </button>

      <button class="save-workout-button" type="button" :disabled="saving || !canSave" @click="emit('save')">
        {{ saving ? 'Saving…' : hasExistingSets ? 'Save changes' : 'Save exercise' }}
      </button>
    </div>

    <ExerciseHistoryPanel v-if="showHistory" :exercise-id="exercise.id" />
    <ExerciseRecordsPanel v-if="showRecords" :exercise-id="exercise.id" />
  </div>
</template>
