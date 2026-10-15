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
      <button type="button" aria-label="No icon" :aria-pressed="selected === ''" @click="chooseNone">
        <span class="muscle-icon-empty" aria-hidden="true">∅</span>
      </button>
      <button type="button" aria-label="Abs" :aria-pressed="selected === 'abs'" @click="chooseAbs">
        <ExerciseMuscleIndicator icon-id="abs" />
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
  grid-template-columns: repeat(auto-fill, 48px);
  gap: 10px;
}
.muscle-icon-options button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
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
