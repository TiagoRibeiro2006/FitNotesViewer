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

function chooseLats() {
  emit('select', 'lats')
}

function chooseGlutes() {
  emit('select', 'glutes')
}

function chooseBiceps() {
  emit('select', 'biceps')
}

function chooseSideDelts() {
  emit('select', 'side-delts')
}

function chooseChest() {
  emit('select', 'chest')
}

function chooseAdductors() {
  emit('select', 'adductors')
}

function chooseTriceps() {
  emit('select', 'triceps')
}

function chooseFrontDelts() {
  emit('select', 'front-delts')
}

function chooseRearDelts() {
  emit('select', 'rear-delts')
}

function chooseTraps() {
  emit('select', 'traps')
}

function chooseHamstrings() {
  emit('select', 'hamstrings')
}

function chooseCalfs() {
  emit('select', 'calfs')
}

function chooseQuads() {
  emit('select', 'quads')
}

function chooseForearm() {
  emit('select', 'forearm')
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
      <button type="button" aria-label="Lats" :aria-pressed="selected === 'lats'" @click="chooseLats">
        <ExerciseMuscleIndicator icon-id="lats" />
      </button>
      <button type="button" aria-label="Glutes" :aria-pressed="selected === 'glutes'" @click="chooseGlutes">
        <ExerciseMuscleIndicator icon-id="glutes" />
      </button>
      <button type="button" aria-label="Biceps" :aria-pressed="selected === 'biceps'" @click="chooseBiceps">
        <ExerciseMuscleIndicator icon-id="biceps" />
      </button>
      <button type="button" aria-label="Side delts" :aria-pressed="selected === 'side-delts'" @click="chooseSideDelts">
        <ExerciseMuscleIndicator icon-id="side-delts" />
      </button>
      <button type="button" aria-label="Chest" :aria-pressed="selected === 'chest'" @click="chooseChest">
        <ExerciseMuscleIndicator icon-id="chest" />
      </button>
      <button type="button" aria-label="Adductors" :aria-pressed="selected === 'adductors'" @click="chooseAdductors">
        <ExerciseMuscleIndicator icon-id="adductors" />
      </button>
      <button type="button" aria-label="Triceps" :aria-pressed="selected === 'triceps'" @click="chooseTriceps">
        <ExerciseMuscleIndicator icon-id="triceps" />
      </button>
      <button type="button" aria-label="Front delts" :aria-pressed="selected === 'front-delts'" @click="chooseFrontDelts">
        <ExerciseMuscleIndicator icon-id="front-delts" />
      </button>
      <button type="button" aria-label="Rear delts" :aria-pressed="selected === 'rear-delts'" @click="chooseRearDelts">
        <ExerciseMuscleIndicator icon-id="rear-delts" />
      </button>
      <button type="button" aria-label="Traps" :aria-pressed="selected === 'traps'" @click="chooseTraps">
        <ExerciseMuscleIndicator icon-id="traps" />
      </button>
      <button type="button" aria-label="Hamstrings" :aria-pressed="selected === 'hamstrings'" @click="chooseHamstrings">
        <ExerciseMuscleIndicator icon-id="hamstrings" />
      </button>
      <button type="button" aria-label="Calfs" :aria-pressed="selected === 'calfs'" @click="chooseCalfs">
        <ExerciseMuscleIndicator icon-id="calfs" />
      </button>
      <button type="button" aria-label="Quads" :aria-pressed="selected === 'quads'" @click="chooseQuads">
        <ExerciseMuscleIndicator icon-id="quads" />
      </button>
      <button type="button" aria-label="Forearm" :aria-pressed="selected === 'forearm'" @click="chooseForearm">
        <ExerciseMuscleIndicator icon-id="forearm" />
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
