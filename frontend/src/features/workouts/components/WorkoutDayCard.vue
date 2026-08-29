<script setup>
import { formatNumber } from '../../../shared/utils/numbers'
import { usePressDragList } from '../../../shared/composables/usePressDragList'

defineProps({
  dateLabel: { type: String, required: true },
  exercises: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  reordering: { type: Boolean, default: false },
})

const emit = defineEmits(['add', 'copy', 'edit', 'move-exercise', 'next', 'previous', 'save-exercise-order', 'today'])
const { draggingIndex, consumeClick, startDrag } = usePressDragList(moveExercise, saveExerciseOrder)

function moveExercise(fromIndex, toIndex) {
  emit('move-exercise', fromIndex, toIndex)
}

function saveExerciseOrder() {
  emit('save-exercise-order')
}

function openExercise(event, exercise) {
  if (!consumeClick(event)) emit('edit', exercise)
}
</script>

<template>
  <section class="day-card home-day-card">
    <div class="day-navigation">
      <button class="nav-button" aria-label="Previous day" @click="emit('previous')">←</button>
      <div class="day-title">
        <h2 @click="emit('today')">{{ dateLabel }}</h2>
      </div>
      <button class="nav-button" aria-label="Next day" @click="emit('next')">→</button>
    </div>

    <p v-if="loading" class="modal-list-status">Loading workout…</p>
    <p v-else-if="error" class="editor-error">{{ error }}</p>

    <div
      v-else-if="exercises.length"
      class="exercise-list"
      :class="{ 'is-reordering': draggingIndex >= 0 }"
      data-press-drag-list
    >
      <button
        v-for="(exercise, index) in exercises"
        :key="exercise.id"
        class="exercise-row"
        :class="{ 'is-dragging': draggingIndex === index }"
        type="button"
        :aria-label="`Edit ${exercise.name}`"
        :aria-pressed="draggingIndex === index"
        data-press-drag-item
        @contextmenu.prevent
        @pointerdown="startDrag($event, index, reordering)"
        @click="openExercise($event, exercise)"
      >
        <span class="exercise-row-heading">
          <strong>{{ exercise.name }}</strong>
          <span class="exercise-row-chevron" aria-hidden="true">›</span>
        </span>
        <span class="exercise-set-list">
          <span v-for="(set, index) in exercise.sets" :key="set.id" class="exercise-set-row">
            <span class="exercise-set-number">{{ index + 1 }}</span>
            <span class="exercise-set-weight"><span class="exercise-set-value">{{ formatNumber(set.weight) }}</span> kg</span>
            <span class="exercise-set-reps"><span class="exercise-set-value">{{ set.reps }}</span> reps</span>
          </span>
        </span>
      </button>
    </div>

    <div class="day-actions" :class="{ 'is-empty': !exercises.length }">
      <button class="day-action day-add-exercise" type="button" @click="emit('add')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Add Exercise</span>
      </button>

      <button v-if="!exercises.length" class="day-action day-copy-previous" type="button" @click="emit('copy')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="8" width="11" height="11" rx="2" />
          <path d="M16 8V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h1" />
        </svg>
        <span>Copy Previous Day</span>
      </button>
    </div>
  </section>
</template>
