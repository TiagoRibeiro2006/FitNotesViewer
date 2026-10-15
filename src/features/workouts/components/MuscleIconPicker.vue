<script setup>
import ActionModal from '../../../shared/components/ActionModal.vue'
import ExerciseMuscleIndicator from './ExerciseMuscleIndicator.vue'

defineProps({
  open: { type: Boolean, required: true },
  selected: { type: String, default: '' },
  colour: { type: String, required: true },
})
const emit = defineEmits(['close', 'select'])

function close() {
  emit('close')
}

function chooseNone() {
  emit('select', '')
}

function chooseAbs() {
  emit('select', 'abs')
}
</script>

<template>
  <ActionModal :open="open" aria-label="Choose muscle icon" title="Choose an icon" layer-class="muscle-icon-picker-layer" @close="close">
    <div class="muscle-icon-options" :style="{ '--category-color': colour }">
      <button type="button" :aria-pressed="selected === ''" @click="chooseNone">
        <span class="muscle-icon-empty" aria-hidden="true">∅</span>
        <span>No icon</span>
      </button>
      <button type="button" :aria-pressed="selected === 'abs'" @click="chooseAbs">
        <ExerciseMuscleIndicator icon-id="abs" />
        <span>Abs</span>
      </button>
    </div>
  </ActionModal>
</template>

<style>
.modal-layer.muscle-icon-picker-layer {
  z-index: 260;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.muscle-icon-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.muscle-icon-options button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 105px;
  border: 1px solid #35353b;
  border-radius: var(--box-radius);
  background: #19191b;
  color: #fff;
  cursor: pointer;
}
.muscle-icon-options button[aria-pressed='true'] {
  border-color: #62adff;
  background: #142238;
}
.muscle-icon-empty {
  height: 24px;
  color: #93939c;
  font-size: 24px;
  line-height: 24px;
}
</style>
