<script setup>
import { ref, watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'
import { useExerciseOrder } from '../composables/useExerciseOrder.js'
import ResetExerciseOrderModal from './ResetExerciseOrderModal.vue'
import ExerciseMuscleIndicator from '../../../shared/components/MuscleIndicator.vue'
import { androidColorToCss } from '../../../shared/utils/colors'
import { useMuscleAppearance } from '../../../shared/composables/useMuscleAppearance.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  date: { type: String, required: true },
  dateLabel: { type: String, required: true },
  exercises: { type: Array, required: true },
})
const emit = defineEmits(['close', 'saved'])
const order = useExerciseOrder()
const resetting = ref(false)
const { homeIndicatorsEnabled } = useMuscleAppearance()

watch(readOpen, initialize)

function readOpen() {
  return props.open
}

function initialize(open) {
  resetting.value = false
  if (open) order.open(props.exercises, props.date)
}

async function close() {
  if (resetting.value) return
  if (await order.save()) {
    emit('saved')
    emit('close')
  }
}

function requestReset() {
  if (order.changed.value && !order.saving.value) resetting.value = true
}

function cancelReset() {
  resetting.value = false
}

function resetOrder() {
  order.reset()
  cancelReset()
}

function muscleStyle(exercise) {
  return { '--category-color': androidColorToCss(exercise.categoryColor) }
}
</script>

<template>
  <BaseModal :open="open" aria-label="Change Order" @close="close">
    <header class="modal-header">
      <button class="modal-icon-button" :class="{ 'exercise-order-close-changed': order.changed.value }" type="button" aria-label="Save order and close" :disabled="order.saving.value" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
      </button>
      <div class="modal-heading">
        <p>{{ dateLabel }}</p>
        <h2>Change Order</h2>
      </div>
      <button
        class="modal-icon-button exercise-order-reset"
        type="button"
        aria-label="Restore original order"
        :disabled="!order.changed.value || order.saving.value"
        @click="requestReset"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg>
      </button>
    </header>
    <div class="exercise-order-content">
      <ol class="exercise-order-list">
        <li v-for="(exercise, index) in order.exercises.value" :key="exercise.id" class="exercise-order-row">
          <div class="exercise-order-name">
            <span class="exercise-order-number" :aria-label="`Original position ${order.originalPosition(exercise.id)}`">{{ order.originalPosition(exercise.id) }}</span>
            <strong>{{ exercise.name }}</strong>
          </div>
          <div class="exercise-order-controls">
            <span v-if="homeIndicatorsEnabled" class="exercise-order-muscle" :style="muscleStyle(exercise)"><ExerciseMuscleIndicator :name="exercise.categoryName" :icon-id="exercise.categoryIcon" /></span>
            <button type="button" :aria-label="`Move ${exercise.name} up`" :disabled="index === 0 || order.saving.value" @click="order.move(index, -1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
            </button>
            <button type="button" :aria-label="`Move ${exercise.name} down`" :disabled="index === order.exercises.value.length - 1 || order.saving.value" @click="order.move(index, 1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m-6-6 6 6 6-6" /></svg>
            </button>
          </div>
        </li>
      </ol>
      <p v-if="order.error.value" class="editor-error" role="alert">{{ order.error.value }}</p>
      <p v-if="order.saving.value" role="status">Saving order…</p>
    </div>
  </BaseModal>
  <ResetExerciseOrderModal :open="resetting" @cancel="cancelReset" @reset="resetOrder" />
</template>

<style scoped>
.exercise-order-close-changed {
  border-color: var(--accent-colour, #3f96ff);
  background: var(--theme-accent-surface, #142238);
  color: var(--accent-ink, #62adff);
}
.exercise-order-close-changed:active {
  background: var(--theme-accent-surface, #203957);
}
.exercise-order-reset:not(:disabled) {
  border-color: var(--theme-text-muted, #64646d);
  color: var(--theme-text-primary, #fff);
}
.exercise-order-reset:disabled {
  opacity: .3;
  cursor: default;
}
.exercise-order-content {
  padding: 16px;
  overflow-y: auto;
}
.exercise-order-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.exercise-order-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--theme-border, #242424);
  border-radius: var(--box-radius);
  background: var(--theme-surface-raised, #19191b);
}
.exercise-order-row strong {
  min-width: 0;
  overflow-wrap: anywhere;
}
.exercise-order-name {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.exercise-order-number {
  flex-shrink: 0;
  min-width: 24px;
  color: var(--theme-text-secondary, #8f8f96);
  font-size: 14px;
  font-weight: 800;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.exercise-order-controls {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
}
.exercise-order-muscle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  margin-right: 4px;
}
.exercise-order-controls button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--theme-text-primary, #fff);
  cursor: pointer;
}
.exercise-order-controls button:disabled {
  opacity: .25;
  cursor: default;
}
.exercise-order-controls button:active:not(:disabled) {
  background: var(--theme-surface-muted, #303034);
}
.exercise-order-controls button > svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
