<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  categories: { type: Array, required: true },
  creating: { type: Boolean, default: false },
  error: { type: String, default: '' },
  exercise: { type: Object, required: true },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['save'])
const name = ref('')
const categoryId = ref(null)
const canSave = computed(readCanSave)

watch(readExercise, fillForm, { immediate: true })

function readExercise() {
  return props.exercise
}

function fillForm(exercise) {
  name.value = exercise.name ?? ''
  categoryId.value = exercise.categoryId ?? null
}

function readCanSave() {
  return name.value.trim().length > 0 && categoryId.value !== null
}

function updateCategory(event) {
  const selectedId = event.target.value
  for (const category of props.categories) {
    if (String(category.id) === selectedId) categoryId.value = category.id
  }
}

function submit() {
  if (!canSave.value || props.saving) return
  emit('save', { name: name.value, categoryId: categoryId.value })
}
</script>

<template>
  <form class="exercise-details-editor" @submit.prevent="submit">
    <label class="exercise-details-field">
      <span>Name</span>
      <input
        v-model="name"
        type="text"
        maxlength="100"
        autocomplete="off"
        spellcheck="false"
        required
      />
    </label>

    <label class="exercise-details-field">
      <span>Muscle</span>
      <select :value="categoryId" required @change="updateCategory">
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
    </label>

    <p v-if="error" class="editor-error">{{ error }}</p>

    <button class="save-workout-button exercise-details-save" type="submit" :disabled="saving || !canSave">
      {{ saving ? 'Saving…' : creating ? 'Add exercise' : 'Save exercise' }}
    </button>
  </form>
</template>
