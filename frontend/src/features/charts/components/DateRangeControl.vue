<script setup>
const props = defineProps({
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  actionLabel: { type: String, default: 'Apply' },
})

const emit = defineEmits(['update:startDate', 'update:endDate', 'apply'])

function updateStartDate(event) {
  emit('update:startDate', event.currentTarget.value)
}

function updateEndDate(event) {
  emit('update:endDate', event.currentTarget.value)
}

function applyInterval() {
  emit('apply')
}
</script>

<template>
  <form class="date-interval-control" @submit.prevent="applyInterval">
    <label>
      <span>Start date</span>
      <input
        :value="startDate"
        type="date"
        :max="endDate"
        required
        @input="updateStartDate"
      >
    </label>
    <label>
      <span>End date</span>
      <input
        :value="endDate"
        type="date"
        :min="startDate"
        required
        @input="updateEndDate"
      >
    </label>
    <button type="submit">{{ actionLabel }}</button>
  </form>
</template>
