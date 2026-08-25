<script setup>
import { formatNumber } from '../../../shared/utils/numbers'

defineProps({
  dateLabel: { type: String, required: true },
  exercises: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['add', 'copy', 'edit', 'next', 'previous', 'today'])
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

    <div v-else-if="exercises.length" class="exercise-list">
      <button
        v-for="exercise in exercises"
        :key="exercise.id"
        class="exercise-row"
        type="button"
        :aria-label="`Edit ${exercise.name}`"
        @click="emit('edit', exercise)"
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
