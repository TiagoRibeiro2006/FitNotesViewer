<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { getWorkoutDateSet } from '../../data/repositories/workoutRepository'
import CalendarList from './components/CalendarList.vue'
import { createCalendarMonths, monthKey } from './calendarUtils'

defineProps({
  selectedDate: { type: String, required: true },
  selectedDateLabel: { type: String, required: true },
})

const emit = defineEmits(['select'])
const workoutDates = ref(new Set())
const loading = ref(false)
const error = ref('')

const months = computed(() => createCalendarMonths(workoutDates.value))
const currentMonthKey = computed(() => {
  const now = new Date()
  return monthKey(now.getFullYear(), now.getMonth())
})

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''

  try {
    workoutDates.value = await getWorkoutDateSet()
  } catch {
    error.value = 'Workout dates could not be loaded.'
  } finally {
    loading.value = false
  }

  await nextTick()
  scrollToCurrentMonth()
}

function scrollToCurrentMonth() {
  const currentMonth = document.getElementById('calendar-current-month')
  if (!currentMonth) return

  const top = currentMonth.getBoundingClientRect().top + window.scrollY - 20
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
}
</script>

<template>
  <header class="app-header calendar-header">
    <div>
      <p class="eyebrow">FITNOTES VIEWER</p>
      <h1>Calendar</h1>
    </div>
    <span class="data-pill">{{ selectedDateLabel }}</span>
  </header>

  <section class="calendar-intro">
    <p>Choose a day to open it. Scroll up for previous months.</p>
  </section>

  <p v-if="loading" class="calendar-intro">Loading workout dates…</p>
  <p v-else-if="error" class="body-error">{{ error }}</p>
  <CalendarList
    v-else
    :months="months"
    :current-month-key="currentMonthKey"
    current-month-element-id="calendar-current-month"
    :workout-dates="workoutDates"
    :selected-date="selectedDate"
    aria-label="Workout calendar"
    @select="emit('select', $event)"
  />
</template>
