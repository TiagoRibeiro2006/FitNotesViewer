<script setup>
import { watch } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'
import { useExerciseOrder } from '../composables/useExerciseOrder.js'

const props = defineProps({
  open: { type: Boolean, required: true },
  date: { type: String, required: true },
  dateLabel: { type: String, required: true },
  exercises: { type: Array, required: true },
})
const emit = defineEmits(['close', 'saved'])
const order = useExerciseOrder()

watch(readOpen, initialize)

function readOpen() {
  return props.open
}

function initialize(open) {
  if (open) order.open(props.exercises, props.date)
}

async function close() {
  if (await order.save()) {
    emit('saved')
    emit('close')
  }
}
</script>

<template>
  <BaseModal :open="open" aria-label="Change Order" @close="close">
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Save order and close" :disabled="order.saving.value" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
      </button>
      <div class="modal-heading">
        <p>{{ dateLabel }}</p>
        <h2>Change Order</h2>
      </div>
      <span class="modal-header-spacer"></span>
    </header>
    <div class="exercise-order-content">
      <ol class="exercise-order-list">
        <li v-for="(exercise, index) in order.exercises.value" :key="exercise.id" class="exercise-order-row">
          <strong>{{ exercise.name }}</strong>
          <div class="exercise-order-controls">
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
</template>

<style scoped>
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
  border: 1px solid #242424;
  border-radius: var(--box-radius);
  background: #19191b;
}
.exercise-order-row strong {
  min-width: 0;
  overflow-wrap: anywhere;
}
.exercise-order-controls {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
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
  color: #fff;
  cursor: pointer;
}
.exercise-order-controls button:disabled {
  opacity: .25;
  cursor: default;
}
.exercise-order-controls button:active:not(:disabled) {
  background: #303034;
}
.exercise-order-controls svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
