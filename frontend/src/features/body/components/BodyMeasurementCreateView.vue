<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  error: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])
const name = ref('')
const unit = ref('kg')
const canSave = computed(readCanSave)

function readCanSave() {
  return name.value.trim().length > 0
}

function submit() {
  if (!canSave.value || props.saving) return
  emit('save', { name: name.value, unit: unit.value })
}
</script>

<template>
  <section class="body-create-page">
    <header class="body-detail-header">
      <button class="body-detail-back" type="button" aria-label="Back to body tracker" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m7 7 10 10M17 7 7 17" />
        </svg>
      </button>
      <div>
        <p class="eyebrow">BODY TRACKER</p>
        <h1>Add measurement</h1>
      </div>
    </header>

    <form class="body-detail-card body-create-form" @submit.prevent="submit">
      <label>
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

      <label>
        <span>Unit</span>
        <select v-model="unit">
          <option value="kg">kg</option>
          <option value="cm">cm</option>
          <option value="%">%</option>
        </select>
      </label>

      <p v-if="error" class="body-error body-create-error">{{ error }}</p>

      <button class="body-value-save" type="submit" :disabled="saving || !canSave">
        {{ saving ? 'Adding…' : 'Add measurement' }}
      </button>
    </form>
  </section>
</template>
