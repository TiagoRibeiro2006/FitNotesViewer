<script setup>
import { computed, ref, watch } from 'vue'
import { androidColorToCss } from '../../../shared/utils/colors'

const props = defineProps({
  error: { type: String, default: '' },
  muscle: { type: Object, required: true },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['save'])
const colour = ref('#7c7c85')
const name = ref('')
const canSave = computed(readCanSave)

watch(readMuscle, fillForm, { immediate: true })

function readMuscle() {
  return props.muscle
}

function fillForm(muscle) {
  name.value = muscle.name ?? ''
  colour.value = androidColorToCss(muscle.colour)
}

function readCanSave() {
  return name.value.trim().length > 0 && /^#[0-9a-f]{6}$/i.test(colour.value)
}

function submit() {
  if (!canSave.value || props.saving) return
  emit('save', { name: name.value, colour: colour.value })
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

    <p v-if="error" class="editor-error">{{ error }}</p>

    <button class="save-workout-button exercise-details-save" type="submit" :disabled="saving || !canSave">
      {{ saving ? 'Saving…' : 'Save muscle' }}
    </button>
  </form>
</template>
