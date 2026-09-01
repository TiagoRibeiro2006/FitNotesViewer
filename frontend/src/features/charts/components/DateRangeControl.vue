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
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'apply'])
const intervalDays = computed(readIntervalDays)
const startDateMaximum = computed(readStartDateMaximum)
const endDateMinimum = computed(readEndDateMinimum)
const endDateMaximum = todayKey()

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
</script>

<template>
  <form class="date-interval-control" @submit.prevent="applyInterval">
    <label>
      <span>Start date</span>
      <input
        :value="startDate"
        type="date"
        :max="startDateMaximum"
        required
        @input="updateStartDate"
      >
    </label>
    <label>
      <span>End date</span>
      <input
        :value="endDate"
        type="date"
        :min="endDateMinimum"
        :max="endDateMaximum"
        required
        @input="updateEndDate"
      >
    </label>
    <output class="date-interval-days" :aria-label="intervalDays + ' days selected'">
      <strong>{{ intervalDays }}</strong>
      <span>days</span>
    </output>
    <button type="submit">{{ actionLabel }}</button>
  </form>
</template>
