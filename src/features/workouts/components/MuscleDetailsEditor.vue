<script setup>
import { computed, ref, watch } from 'vue'
import { androidColorToCss } from '../../../shared/utils/colors'
import CatalogDeleteButton from './CatalogDeleteButton.vue'
import ExerciseMuscleIndicator from '../../../shared/components/MuscleIndicator.vue'
import MuscleIconPicker from './MuscleIconPicker.vue'
import { resolveMuscleIcon } from '../../../shared/models/muscleIcons.js'

const props = defineProps({
  error: { type: String, default: '' },
  creating: { type: Boolean, default: false },
  deleting: { type: Boolean, default: false },
  exerciseCount: { type: Number, default: 0 },
  muscle: { type: Object, required: true },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['delete', 'save'])
const colour = ref('#7c7c85')
const name = ref('')
const iconId = ref('')
const iconPickerOpen = ref(false)
const canSave = computed(readCanSave)
const iconLabel = computed(readIconLabel)

watch(readMuscle, fillForm, { immediate: true })

function readMuscle() {
  return props.muscle
}

function fillForm(muscle) {
  name.value = muscle.name ?? ''
  colour.value = androidColorToCss(muscle.colour)
  iconId.value = resolveMuscleIcon(muscle.name, muscle.iconId)
  iconPickerOpen.value = false
}

function readCanSave() {
  return name.value.trim().length > 0 && /^#[0-9a-f]{6}$/i.test(colour.value)
}

function readIconLabel() {
  if (!iconId.value) return 'No icon'
  return (iconId.value.charAt(0).toUpperCase() + iconId.value.slice(1)).replaceAll('-', ' ')
}

function submit() {
  if (!canSave.value || props.saving) return
  if (iconPickerOpen.value) return
  emit('save', { name: name.value, colour: colour.value, iconId: iconId.value })
}

function openIconPicker() {
  iconPickerOpen.value = true
}

function closeIconPicker() {
  iconPickerOpen.value = false
}

function selectIcon(icon) {
  iconId.value = icon
  closeIconPicker()
}
</script>

<template>
  <form class="exercise-details-editor" @submit.prevent="submit">
    <label class="exercise-details-field">
      <span>Name</span>
      <input v-model="name" type="text" maxlength="100" autocomplete="off" spellcheck="false" required />
    </label>

    <label class="exercise-details-field">
      <span>Colour</span>
      <span class="muscle-colour-field">
        <input v-model="colour" type="color" aria-label="Muscle colour" />
        <strong>{{ colour.toUpperCase() }}</strong>
      </span>
    </label>

    <div class="exercise-details-field">
      <span>Icon</span>
      <button class="muscle-icon-field" type="button" :style="{ '--category-color': colour }" :disabled="saving" @click="openIconPicker">
        <ExerciseMuscleIndicator :icon-id="iconId" preview />
        <span>{{ iconLabel }}</span>
        <span class="exercise-chevron" aria-hidden="true">›</span>
      </button>
    </div>

    <p v-if="error" class="editor-error">{{ error }}</p>

    <button class="save-workout-button exercise-details-save" type="submit" :disabled="saving || !canSave">
      {{ saving ? 'Saving…' : creating ? 'Add muscle' : 'Save muscle' }}
    </button>

    <CatalogDeleteButton
      v-if="!creating"
      :deleting="deleting"
      :disabled="exerciseCount > 0"
      label="Delete muscle"
      :warning="exerciseCount > 0 ? 'Move or delete the exercises in this muscle first.' : ''"
      @delete="emit('delete')"
    />
  </form>
  <MuscleIconPicker :open="iconPickerOpen" :selected="iconId" :colour="colour" @close="closeIconPicker" @select="selectIcon" />
</template>

<style scoped>
.muscle-icon-field {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 56px;
  padding: 12px 16px;
  border: 1px solid #303036;
  border-radius: var(--box-radius);
  background: #18181c;
  color: #fff;
  cursor: pointer;
}
.muscle-icon-field .exercise-chevron {
  margin-left: auto;
}
</style>
