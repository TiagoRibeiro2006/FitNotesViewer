<script setup>
import { computed } from 'vue'
import { createTrainingSets } from '../analytics/trainingAnalytics.js'
import TrainingAiChat from './TrainingAiChat.vue'
import TrainingPeriodAnalysis from './TrainingPeriodAnalysis.vue'

const props = defineProps({
  data: { type: Object, required: true },
})

const sets = computed(readSets)

function readSets() {
  return createTrainingSets(props.data)
}
</script>

<template>
  <div class="charts-panel-stack">
    <TrainingPeriodAnalysis v-if="sets.length" :sets="sets" />

    <section v-else class="chart-empty-card">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V9m5 10V5m6 14v-7m5 7V3" />
      </svg>
      <strong>No workouts to analyse</strong>
      <p>Add sets in the Log to generate an AI training review.</p>
    </section>

    <TrainingAiChat :sets="sets" />
  </div>
</template>
