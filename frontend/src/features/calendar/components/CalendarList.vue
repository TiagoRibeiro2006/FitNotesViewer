<script setup>
import CalendarMonth from './CalendarMonth.vue'

defineProps({
  months: { type: Array, required: true },
  currentMonthKey: { type: String, required: true },
  currentMonthElementId: { type: String, default: '' },
  selectedDate: { type: String, default: '' },
  workoutDates: { type: Set, required: true },
  workoutColors: { type: Map, default: () => new Map() },
  actionLabelPrefix: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, required: true },
})

const emit = defineEmits(['select'])
</script>

<template>
  <section class="calendar-stack" :aria-label="ariaLabel">
    <CalendarMonth
      v-for="month in months"
      :key="month.key"
      :month="month"
      :current-month-key="currentMonthKey"
      :current-month-element-id="currentMonthElementId"
      :selected-date="selectedDate"
      :workout-dates="workoutDates"
      :workout-colors="workoutColors"
      :action-label-prefix="actionLabelPrefix"
      :disabled="disabled"
      @select="emit('select', $event)"
    />
  </section>
</template>
