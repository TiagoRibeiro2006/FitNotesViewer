<script setup>
import { formatNumber } from '../../../shared/utils/numbers.js'
import { useWeightUnitPreference } from '../../../shared/units/useWeightUnitPreference.js'

const props = defineProps({
  candidates: { type: Array, required: true },
  error: { type: String, default: '' },
  saving: { type: Boolean, default: false },
  selectedId: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm', 'select'])
const {
  displayMeasurementUnit,
  displayMeasurementValue,
} = useWeightUnitPreference()

function selectCandidate(item) {
  emit('select', String(item.id))
}

function formatCurrentValue(item) {
  if (item.value === null || item.value === undefined || !Number.isFinite(Number(item.value))) {
    return 'No values yet'
  }
  const value = displayMeasurementValue(item.value, item.unit)
  return `${formatNumber(value)} ${displayMeasurementUnit(item.unit)}`
}
</script>

<template>
  <div class="body-ai-view body-weight-assignment-view">
    <section class="body-ai-card body-weight-assignment-card">
      <div class="body-weight-assignment-heading">
        <button type="button" class="body-weight-assignment-back" aria-label="Back" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <div>
          <p class="eyebrow">BODY AI</p>
          <h2>Assign Body Weight</h2>
        </div>
      </div>

      <p class="body-ai-description body-weight-assignment-description">
        Choose which weight measurement should be used as Body Weight for pace and goal analysis.
      </p>

      <div v-if="candidates.length" class="body-weight-assignment-list" role="radiogroup" aria-label="Body Weight measurement">
        <button
          v-for="item in candidates"
          :key="item.id"
          type="button"
          class="body-weight-assignment-option"
          :class="{ 'is-selected': selectedId === String(item.id) }"
          role="radio"
          :aria-checked="selectedId === String(item.id)"
          @click="selectCandidate(item)"
        >
          <span class="body-weight-assignment-radio" aria-hidden="true">
            <span></span>
          </span>
          <span class="body-weight-assignment-copy">
            <strong>{{ item.name }}</strong>
            <small>{{ formatCurrentValue(item) }}</small>
          </span>
          <span v-if="item.favorite" class="body-weight-assignment-favorite">Favorite</span>
        </button>
      </div>

      <div v-else class="body-weight-assignment-empty">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h10M7 12h10M7 17h6" />
        </svg>
        <strong>No weight measurements available</strong>
        <p>Add a weight measurement in Body Tracker, then return here to assign it.</p>
      </div>

      <p v-if="error" class="body-ai-result-error">{{ error }}</p>

      <button
        type="button"
        class="body-weight-assignment-confirm"
        :disabled="!selectedId || saving"
        @click="emit('confirm')"
      >
        {{ saving ? 'Assigning…' : 'Confirm Body Weight' }}
      </button>
    </section>
  </div>
</template>
