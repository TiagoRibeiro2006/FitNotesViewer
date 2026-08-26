<script setup>
import { watch } from 'vue'
import { formatDate } from '../../../shared/utils/dates'
import { formatNumber } from '../../../shared/utils/numbers'
import { useExerciseHistory } from '../composables/useExerciseHistory'

const props = defineProps({
  exerciseId: { type: [Number, String], required: true },
})

const { days, error, loading, load } = useExerciseHistory()

watch(readExerciseId, load, { immediate: true })

function readExerciseId() {
  return props.exerciseId
}

function setCountLabel(count) {
  return `${count} ${count === 1 ? 'set' : 'sets'}`
}
</script>

<template>
  <section class="exercise-history-card" aria-label="Exercise history">
    <p class="exercise-history-title">History</p>

    <p v-if="loading" class="exercise-history-status">Loading history…</p>
    <p v-else-if="error" class="exercise-history-status is-error">{{ error }}</p>
    <p v-else-if="!days.length" class="exercise-history-status">No history yet</p>

    <article v-for="day in days" v-else :key="day.date" class="exercise-history-day">
      <header>
        <strong>{{ formatDate(day.date) }}</strong>
        <span>{{ setCountLabel(day.sets.length) }}</span>
      </header>

      <div v-for="(set, index) in day.sets" :key="set.id" class="exercise-history-set">
        <span>{{ index + 1 }}</span>
        <strong>{{ formatNumber(set.weight) }} <small>kg</small></strong>
        <strong>{{ formatNumber(set.reps) }} <small>reps</small></strong>
      </div>
    </article>
  </section>
</template>
