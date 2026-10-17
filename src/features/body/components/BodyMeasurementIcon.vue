<script setup>
import { computed } from 'vue'
import MuscleIndicator from '../../../shared/components/MuscleIndicator.vue'
import { bodyMeasurementIcon } from '../bodyMeasurementIcons.js'

const props = defineProps({ name: { type: String, required: true } })
const iconId = computed(readIconId)

function readIconId() {
  return bodyMeasurementIcon(props.name)
}
</script>

<template>
  <MuscleIndicator v-if="iconId" class="body-muscle-icon" :icon-id="iconId" preview />
</template>

<style scoped>
.body-muscle-icon {
  --category-color: #4b9cff;
}
</style>
