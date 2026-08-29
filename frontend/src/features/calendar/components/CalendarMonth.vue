<script setup>
import { formatDate } from '../../../shared/utils/dates'
import { isToday } from '../calendarUtils'

const props = defineProps({
  month: { type: Object, required: true },
  currentMonthKey: { type: String, required: true },
  currentMonthElementId: { type: String, default: '' },
  selectedDate: { type: String, default: '' },
  workoutDates: { type: Set, required: true },
  actionLabelPrefix: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

function hasWorkout(dateKey) {
  return props.workoutDates.has(dateKey)
}

function actionLabel(dateKey) {
  const date = formatDate(dateKey)
  return props.actionLabelPrefix ? `${props.actionLabelPrefix} ${date}` : date
}
</script>

<template>
  <article :id="month.key === currentMonthKey ? currentMonthElementId : undefined" class="calendar-month">
    <div class="calendar-month-heading">
      <h2>{{ month.label }}</h2>
      <span v-if="month.key === currentMonthKey">Current month</span>
    </div>

    <div class="calendar-weekdays" aria-hidden="true">
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
      <span>Sun</span>
    </div>

    <div class="calendar-grid">
      <template v-for="day in month.days" :key="day.key">
        <span v-if="day.blank" class="calendar-day is-blank" aria-hidden="true"></span>
        <button
          v-else
          class="calendar-day"
          :class="{
            'is-selected': selectedDate === day.key,
            'is-today': isToday(day.key),
            'has-workout': hasWorkout(day.key),
          }"
          type="button"
          :disabled="disabled"
          :aria-label="actionLabel(day.key)"
          @click="emit('select', day.key)"
        >
          <span class="calendar-day-number">{{ day.day }}</span>
          <span v-if="hasWorkout(day.key)" class="calendar-workout-dot" aria-hidden="true"></span>
        </button>
      </template>
    </div>
  </article>
</template>
