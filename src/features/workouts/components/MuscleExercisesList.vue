<script setup>
import { ref } from 'vue'
import BaseModal from '../../../shared/components/BaseModal.vue'
import MuscleIndicator from '../../../shared/components/MuscleIndicator.vue'
import { androidColorToCss } from '../../../shared/utils/colors.js'
import { useCatalogManager } from '../composables/useCatalogManager.js'
import ExerciseDetailsEditor from './ExerciseDetailsEditor.vue'

defineProps({ exercises: { type: Array, required: true } })
const emit = defineEmits(['changed'])
const expanded = ref(false)
const open = ref(false)
const manager = useCatalogManager()

function toggle() {
  expanded.value = !expanded.value
}

async function openExercise(exercise) {
  open.value = true
  await manager.open('exercises')
  if (open.value && !manager.error.value) manager.select(exercise)
}

function closeExercise() {
  if (manager.saving.value || manager.deleting.value) return
  open.value = false
}

async function saveExercise(details) {
  await manager.saveExercise(details)
  finishChange()
}

async function deleteExercise() {
  await manager.removeExercise()
  finishChange()
}

function finishChange() {
  if (manager.error.value) return
  emit('changed')
  closeExercise()
}
</script>

<template>
  <div class="muscle-exercises">
    <button class="muscle-exercises-toggle" type="button" :aria-expanded="expanded" @click="toggle">
      {{ expanded ? 'Hide exercises' : 'Show exercises' }} ({{ exercises.length }})
      <span aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
    </button>
    <div v-if="expanded" class="muscle-exercises-list" aria-label="Exercises in this muscle">
      <button v-for="exercise in exercises" :key="exercise.id" class="muscle-exercise-card" type="button" :style="{ '--category-color': androidColorToCss(exercise.categoryColor) }" @click="openExercise(exercise)">
        <MuscleIndicator :name="exercise.categoryName" :icon-id="exercise.categoryIcon" />
        <span class="exercise-picker-copy"><strong>{{ exercise.name }}</strong><small>{{ exercise.categoryName }}</small></span>
        <span class="exercise-chevron" aria-hidden="true">›</span>
      </button>
    </div>
  </div>
  <BaseModal :open="open" aria-label="Edit exercise" @close="closeExercise">
    <header class="modal-header">
      <button class="modal-icon-button" type="button" aria-label="Back to muscle" :disabled="manager.saving.value || manager.deleting.value" @click="closeExercise">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <div class="modal-heading"><h2>Edit exercise</h2></div>
      <span class="modal-header-spacer"></span>
    </header>
    <p v-if="manager.loading.value" class="modal-list-status">Loading…</p>
    <ExerciseDetailsEditor v-else-if="manager.selectedItem.value" :exercise="manager.selectedItem.value" :categories="manager.categories.value" :error="manager.error.value" :saving="manager.saving.value" :deleting="manager.deleting.value" deletable @save="saveExercise" @delete="deleteExercise" />
    <p v-else-if="manager.error.value" class="editor-error">{{ manager.error.value }}</p>
  </BaseModal>
</template>

<style scoped>
.muscle-exercises-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 46px; padding: 10px 14px; border: 1px solid var(--theme-border-strong, #303036); border-radius: var(--box-radius); background: var(--theme-surface-raised, #18181c); color: var(--theme-text-primary, #fff); cursor: pointer; }
.muscle-exercises-list { display: grid; gap: 10px; margin-top: 12px; }
.muscle-exercise-card { display: flex; align-items: center; gap: 14px; width: 100%; min-height: 72px; padding: 14px 16px; border: 1px solid var(--theme-border, #292929); border-radius: var(--box-radius); background: var(--theme-surface, #111); text-align: left; cursor: pointer; }
.muscle-exercise-card .exercise-picker-copy { flex: 1; min-width: 0; }
.muscle-exercises button:focus-visible { outline: 2px solid var(--accent-colour, #4b9cff); outline-offset: 2px; }
</style>
