<script setup>
import { nextTick, ref, watch } from 'vue'
import CalendarList from '../../calendar/components/CalendarList.vue'
import { useWorkoutCalendar } from '../../calendar/composables/useWorkoutCalendar'
import BaseModal from '../../../shared/components/BaseModal.vue'
import { friendlyError } from '../../../shared/utils/errors'
import { copyWorkoutToDate } from '../services/workoutCopyService'

const props = defineProps({
  open: { type: Boolean, required: true },
  targetDate: { type: String, required: true },
  targetDateLabel: { type: String, required: true },
})

const emit = defineEmits(['close', 'copied'])
const { currentMonthKey, loadWorkoutCalendar, months, workoutColors, workoutDates } = useWorkoutCalendar()
const copying = ref(false)
const error = ref('')

watch(() => props.open, (open) => {
  if (open) void prepare()
})

async function prepare() {
  error.value = ''

  try {
    await loadWorkoutCalendar()
  } catch {
    error.value = 'Workout dates could not be loaded.'
  }

  await nextTick()
  document.getElementById('copy-calendar-current-month')?.scrollIntoView({ block: 'start' })
}

function close(force = false) {
  if (!force && copying.value) return
  error.value = ''
  emit('close')
}

async function copyDate(sourceDate) {
  if (copying.value) return
  copying.value = true
  error.value = ''

  try {
    const summary = await copyWorkoutToDate(sourceDate, props.targetDate)
    emit('copied', summary)
    close(true)
  } catch (copyError) {
    error.value = friendlyError(copyError)
  } finally {
    copying.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    aria-label="Copy workout from another day"
    modal-class="copy-calendar-modal"
    @close="close"
  >
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Close" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>

      <div class="modal-heading">
        <p>Copy to {{ targetDateLabel }}</p>
        <h2>Choose a day</h2>
      </div>

      <span class="modal-header-spacer" aria-hidden="true"></span>
    </header>

    <div class="copy-calendar-content">
      <p class="copy-calendar-intro">Choose any day. Empty days will copy an empty log.</p>

      <CalendarList
        :months="months"
        :current-month-key="currentMonthKey"
        current-month-element-id="copy-calendar-current-month"
        :workout-dates="workoutDates"
        :workout-colors="workoutColors"
        action-label-prefix="Copy"
        :disabled="copying"
        aria-label="Choose a workout day to copy"
        @select="copyDate"
      />

      <p v-if="error" class="editor-error copy-calendar-error">{{ error }}</p>
    </div>
  </BaseModal>
</template>
