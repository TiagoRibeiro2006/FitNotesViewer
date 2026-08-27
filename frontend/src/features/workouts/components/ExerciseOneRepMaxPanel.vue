<script setup>
import { computed, ref } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers'
import { calculateRepMaxTable } from '../oneRepMaxCalculator'

const weight = ref('')
const reps = ref('')
const table = computed(readTable)

function readTable() {
  return calculateRepMaxTable(weight.value, reps.value)
}

function hasValue(row) {
  return row.weight !== null
}
</script>

<template>
  <section class="exercise-details-card" aria-label="One rep max calculator">
    <p class="exercise-details-title">1RM Calculator</p>

    <div class="rep-max-inputs">
      <label>
        <span>Weight (kg)</span>
        <input v-model="weight" type="text" inputmode="decimal" placeholder="0" />
      </label>
      <label>
        <span>Reps</span>
        <input v-model="reps" type="number" inputmode="numeric" min="1" max="100" placeholder="0" />
      </label>
    </div>

    <div class="exercise-record-list">
      <div v-for="row in table" :key="row.targetReps" class="exercise-record-row">
        <div class="exercise-record-label">
          <strong>{{ row.targetReps }}</strong>
          <span>RM</span>
        </div>
        <strong v-if="hasValue(row)" class="rep-max-result">{{ formatNumber(row.weight) }} <small>kg</small></strong>
        <span v-else class="exercise-record-empty">—</span>
      </div>
    </div>
  </section>
</template>
