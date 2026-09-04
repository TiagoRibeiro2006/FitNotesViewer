<script setup>
import { computed } from 'vue'
import { shiftDateKey, todayKey } from '../../../shared/utils/dates.js'
import {
  dateIntervalDayCount,
  normalizeSelectableDateInterval,
} from '../analytics/dateRanges.js'

const props = defineProps({
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  actionLabel: { type: String, default: 'Apply' },
  actionDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'apply'])
const intervalDays = computed(readIntervalDays)
const startDateMaximum = computed(readStartDateMaximum)
const endDateMinimum = computed(readEndDateMinimum)
const endDateMaximum = todayKey()
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function updateStartDate(event) {
  const value = event.currentTarget.value
  if (!normalizeSelectableDateInterval(value, props.endDate)) {
    restoreInput(event, props.startDate)
    return
  }
  emit('update:startDate', value)
}

function updateEndDate(event) {
  const value = event.currentTarget.value
  if (!normalizeSelectableDateInterval(props.startDate, value)) {
    restoreInput(event, props.endDate)
    return
  }
  emit('update:endDate', value)
}

function applyInterval() {
  if (props.actionDisabled) return
  emit('apply')
}

function readIntervalDays() {
  return dateIntervalDayCount(props.startDate, props.endDate)
}

function readStartDateMaximum() {
  return shiftDateKey(props.endDate, -1)
}

function readEndDateMinimum() {
  return shiftDateKey(props.startDate, 1)
}

function restoreInput(event, value) {
  event.currentTarget.value = value
}

function formatDateValue(dateKey) {
  const parts = String(dateKey).split('-').map(Number)
  return dateFormatter.format(new Date(parts[0], parts[1] - 1, parts[2]))
}
</script>

<template>
  <form class="date-interval-control" @submit.prevent="applyInterval">
    <label>
      <span>Start date</span>
      <span class="date-input-shell">
        <span class="date-input-value">{{ formatDateValue(startDate) }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
        <input
          class="date-native-input"
          :value="startDate"
          type="date"
          :max="startDateMaximum"
          aria-label="Start date"
          required
          @input="updateStartDate"
        >
      </span>
    </label>
    <label>
      <span>End date</span>
      <span class="date-input-shell">
        <span class="date-input-value">{{ formatDateValue(endDate) }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
        <input
          class="date-native-input"
          :value="endDate"
          type="date"
          :min="endDateMinimum"
          :max="endDateMaximum"
          aria-label="End date"
          required
          @input="updateEndDate"
        >
      </span>
    </label>
    <output class="date-interval-days" :aria-label="intervalDays + ' days selected'">
      <strong>{{ intervalDays }}</strong>
      <span>days</span>
    </output>
    <button type="submit" :disabled="actionDisabled">{{ actionLabel }}</button>
  </form>
</template>
