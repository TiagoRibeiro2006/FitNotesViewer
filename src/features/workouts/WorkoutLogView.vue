<script setup>
import { computed, ref, watch } from 'vue'
import { formatDate, shiftDateKey, todayKey } from '../../shared/utils/dates'
import CopyWorkoutDayModal from './components/CopyWorkoutDayModal.vue'
import WorkoutDayCard from './components/WorkoutDayCard.vue'
import WorkoutExerciseModal from './components/WorkoutExerciseModal.vue'
import { useWorkoutDay } from './composables/useWorkoutDay'

const props = defineProps({
  selectedDate: { type: String, required: true },
  ready: { type: Boolean, default: false },
})

const emit = defineEmits(['update:selected-date', 'summary-changed'])
const selectedDate = computed(() => props.selectedDate)
const exerciseModalOpen = ref(false)
const exerciseModalTarget = ref(null)
const copyModalOpen = ref(false)
const {
  error,
  exercises,
  loading,
  reordering,
  load,
  moveExercise,
  saveExerciseOrder,
} = useWorkoutDay(selectedDate)

const selectedDateLabel = computed(() => {
  const today = todayKey()
  const yesterday = shiftDateKey(today, -1)
  const tomorrow = shiftDateKey(today, 1)

  if (props.selectedDate === today) return 'Today'
  if (props.selectedDate === yesterday) return 'Yesterday'
  if (props.selectedDate === tomorrow) return 'Tomorrow'
  return formatDate(props.selectedDate)
})

const selectedDateLong = computed(() => formatDate(props.selectedDate))

watch(
  () => [props.ready, props.selectedDate],
  ([ready]) => {
    if (ready) void load()
  },
  { immediate: true },
)

function changeDay(amount) {
  emit('update:selected-date', shiftDateKey(props.selectedDate, amount))
}

function goToToday() {
  emit('update:selected-date', todayKey())
}

function openExercisePicker() {
  exerciseModalTarget.value = null
  exerciseModalOpen.value = true
}

function editExercise(exercise) {
  exerciseModalTarget.value = exercise
  exerciseModalOpen.value = true
}

function closeExerciseModal() {
  exerciseModalOpen.value = false
  exerciseModalTarget.value = null
}

async function handleWorkoutChanged(summary) {
  emit('summary-changed', summary)
  await load()
}
</script>

<template>
  <WorkoutDayCard
    :date-label="selectedDateLabel"
    :exercises="exercises"
    :loading="loading"
    :reordering="reordering"
    :error="error"
    @previous="changeDay(-1)"
    @next="changeDay(1)"
    @today="goToToday"
    @add="openExercisePicker"
    @edit="editExercise"
    @move-exercise="moveExercise"
    @save-exercise-order="saveExerciseOrder"
    @copy="copyModalOpen = true"
  />

  <WorkoutExerciseModal
    :open="exerciseModalOpen"
    :date="selectedDate"
    :date-label="selectedDateLong"
    :exercise="exerciseModalTarget"
    @close="closeExerciseModal"
    @data-changed="handleWorkoutChanged"
  />

  <CopyWorkoutDayModal
    :open="copyModalOpen"
    :target-date="selectedDate"
    :target-date-label="selectedDateLong"
    @close="copyModalOpen = false"
    @copied="handleWorkoutChanged"
  />
</template>
