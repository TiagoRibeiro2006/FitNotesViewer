<script setup>
import { computed, watch } from 'vue'
import { formatDate } from '../../../shared/utils/dates'
import { formatNumber } from '../../../shared/utils/numbers'
import { useExerciseHistory } from '../composables/useExerciseHistory'
import { buildExerciseRecords } from '../exerciseRecords'

const props = defineProps({
  exerciseId: { type: [Number, String], required: true },
})

const { days, error, loading, load } = useExerciseHistory()
const records = computed(readRecords)

watch(readExerciseId, load, { immediate: true })

function readExerciseId() {
  return props.exerciseId
}

function readRecords() {
  return buildExerciseRecords(days.value)
}

function hasValue(record) {
  return record.weight !== null
}

function isExact(record) {
  return record.reps === record.targetReps
}
</script>

<template>
  <section class="exercise-details-card" aria-label="Exercise records">
    <p class="exercise-details-title">Records</p>

    <p v-if="loading" class="exercise-details-status">Loading records…</p>
    <p v-else-if="error" class="exercise-details-status is-error">{{ error }}</p>

    <div v-else class="exercise-record-list">
      <article v-for="record in records" :key="record.targetReps" class="exercise-record-row">
        <div class="exercise-record-label">
          <strong>{{ record.targetReps }}</strong>
          <span>RM</span>
        </div>

        <div v-if="hasValue(record)" class="exercise-record-result" :class="{ 'is-higher-reps': !isExact(record) }">
          <strong>{{ formatNumber(record.weight) }} <small>kg ×</small> {{ record.reps }}</strong>
          <time :datetime="record.date">{{ formatDate(record.date) }}</time>
        </div>
        <span v-else class="exercise-record-empty">—</span>
      </article>
    </div>
  </section>
</template>
