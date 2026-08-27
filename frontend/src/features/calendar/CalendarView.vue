<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { getWorkoutCalendarColors } from '../../data/repositories/workoutRepository'
import AppSectionHeader from '../../shared/components/AppSectionHeader.vue'
import CalendarList from './components/CalendarList.vue'
import { createCalendarMonths, monthKey } from './calendarUtils'

defineProps({
  selectedDate: { type: String, required: true },
})

const emit = defineEmits(['select'])
const workoutColors = ref(new Map())
const loading = ref(false)
const error = ref('')

const workoutDates = computed(() => new Set(workoutColors.value.keys()))
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
    workoutColors.value = await getWorkoutCalendarColors()
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

  const bottomNavigation = document.querySelector('.bottom-bar')
  const sectionHeader = document.querySelector('.section-sticky-header')
  const bottomNavigationHeight = bottomNavigation?.getBoundingClientRect().height ?? 0
  const sectionHeaderHeight = sectionHeader?.getBoundingClientRect().height ?? 0
  const visibleHeight = window.innerHeight - bottomNavigationHeight - sectionHeaderHeight
  const margin = Math.max(20, (visibleHeight - currentMonth.offsetHeight) / 2)
  currentMonth.parentElement.style.paddingBottom = `${margin}px`

  const top = currentMonth.getBoundingClientRect().top + window.scrollY - sectionHeaderHeight - margin
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
}
</script>

<template>
  <AppSectionHeader title="Calendar" />

  <p v-if="loading" class="calendar-status">Loading workout dates…</p>
  <p v-else-if="error" class="body-error">{{ error }}</p>
  <CalendarList
    v-else
    :months="months"
    :current-month-key="currentMonthKey"
    current-month-element-id="calendar-current-month"
    :workout-dates="workoutDates"
    :workout-colors="workoutColors"
    :selected-date="selectedDate"
    aria-label="Workout calendar"
    @select="emit('select', $event)"
  />
</template>
