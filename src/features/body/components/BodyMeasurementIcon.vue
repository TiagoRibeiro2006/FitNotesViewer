<script setup>
import { computed } from 'vue'
import MuscleIndicator from '../../../shared/components/MuscleIndicator.vue'
import { bodyMeasurementIcon } from '../bodyMeasurementIcons.js'
import { useMuscleAppearance } from '../../../shared/composables/useMuscleAppearance.js'
import { useBodyIconColour } from '../../../shared/composables/useBodyIconColour.js'

const props = defineProps({
  name: { type: String, required: true },
  iconId: { type: String, default: undefined },
})
const { bodyIconsEnabled } = useMuscleAppearance()
const { bodyIconColour } = useBodyIconColour()
const iconId = computed(readIconId)

function readIconId() {
  if (!bodyIconsEnabled.value) return ''
  return bodyMeasurementIcon(props.name, props.iconId)
}
</script>

<template>
  <MuscleIndicator v-if="iconId" :style="{ '--category-color': bodyIconColour }" :icon-id="iconId" preview />
</template>
