<script setup>
import {
  useWeightUnitPreference,
  WEIGHT_UNIT_OPTIONS,
} from '../../../shared/units/useWeightUnitPreference.js'

const { weightUnit, setWeightUnit } = useWeightUnitPreference()

function selectUnit(unit) {
  setWeightUnit(unit)
}
</script>

<template>
  <section class="settings-card">
    <div class="settings-section-heading">
      <div>
        <p class="eyebrow">PREFERENCES</p>
        <h2>Weight unit</h2>
      </div>
    </div>

    <p class="settings-unit-description">
      Choose how weights are displayed and entered. Saved data remains in kilograms.
    </p>

    <div class="settings-unit-options" role="group" aria-label="Weight unit">
      <button
        v-for="option in WEIGHT_UNIT_OPTIONS"
        :key="option.id"
        class="settings-unit-option"
        :class="{ 'is-selected': weightUnit === option.id }"
        type="button"
        :aria-label="option.label"
        :aria-pressed="weightUnit === option.id"
        @click="selectUnit(option.id)"
      >
        <span>{{ option.symbol }}</span>
      </button>
    </div>
  </section>
</template>
