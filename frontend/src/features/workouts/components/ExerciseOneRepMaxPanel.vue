<script setup>
import { computed, ref } from 'vue'
import { formatNumber } from '../../../shared/utils/numbers'
import { calculateRepMaxTable } from '../oneRepMaxCalculator'
import { useWeightUnitPreference } from '../../../shared/units/useWeightUnitPreference'
import {
  convertRepMaxWeightInput,
  nextRepMaxWeightUnit,
} from '../oneRepMaxUnitConverter.js'

const weight = ref('')
const reps = ref('')
const table = computed(readTable)
const { weightUnit } = useWeightUnitPreference()
const calculatorUnit = ref(weightUnit.value)

function readTable() {
  return calculateRepMaxTable(weight.value, reps.value)
}

function hasValue(row) {
  return row.weight !== null
}

function toggleWeightUnit() {
  const nextUnit = nextRepMaxWeightUnit(calculatorUnit.value)
  weight.value = convertRepMaxWeightInput(weight.value, calculatorUnit.value, nextUnit)
  calculatorUnit.value = nextUnit
}

function toggleLabel() {
  return `Convert calculator from ${calculatorUnit.value} to ${nextRepMaxWeightUnit(calculatorUnit.value)}`
}
</script>

<template>
  <section class="exercise-details-card" aria-label="One rep max calculator">
    <header class="rep-max-heading">
      <p class="exercise-details-title">1RM Calculator</p>
      <button
        class="rep-max-unit-toggle"
        type="button"
        :aria-label="toggleLabel()"
        :title="toggleLabel()"
        @click="toggleWeightUnit"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8h13m-3-3 3 3-3 3M19 16H6m3 3-3-3 3-3" />
        </svg>
        <span>{{ calculatorUnit }}</span>
      </button>
    </header>

    <div class="rep-max-inputs">
      <label>
        <span>Weight ({{ calculatorUnit }})</span>
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
        <strong v-if="hasValue(row)" class="rep-max-result">{{ formatNumber(row.weight) }} <small>{{ calculatorUnit }}</small></strong>
        <span v-else class="exercise-record-empty">—</span>
      </div>
    </div>
  </section>
</template>
