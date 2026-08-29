<script setup>
import { computed, onMounted, ref } from 'vue'
import { formatBodyEntryDate, formatBodyValue } from '../bodyFormatters'
import { useBodyMeasurementDetails } from '../composables/useBodyMeasurementDetails'

const props = defineProps({
  item: { type: Object, required: true },
})

const emit = defineEmits(['close', 'changed'])
const value = ref('')
const {
  error,
  history,
  loading,
  saving,
  addValue,
  load,
} = useBodyMeasurementDetails()

const canSave = computed(() => {
  const text = String(value.value).trim()
  if (!text) return false
  const number = Number(text.replace(',', '.'))
  return Number.isFinite(number) && number >= 0
})

onMounted(() => load(props.item))

async function submit() {
  if (!canSave.value) return
  if (!await addValue(props.item, value.value)) return
  value.value = ''
  emit('changed')
}

function displayValue(record) {
  return formatBodyValue({ ...props.item, value: record.value })
}
</script>

<template>
  <div class="body-detail-page">
    <header class="body-detail-header">
      <button class="body-detail-back" type="button" aria-label="Back to Body Tracker" @click="emit('close')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <div>
        <p class="eyebrow">BODY TRACKER</p>
        <h1>{{ item.name }}</h1>
      </div>
    </header>

    <section class="body-detail-card">
      <p class="body-section-label">New value</p>
      <form class="body-value-form" @submit.prevent="submit">
        <label for="body-detail-value">Value</label>
        <div class="body-value-field">
          <input
            id="body-detail-value"
            v-model="value"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0"
          />
          <span v-if="item.unit">{{ item.unit }}</span>
        </div>

        <p v-if="error" class="editor-error body-value-error">{{ error }}</p>
        <button class="body-value-save" type="submit" :disabled="saving || !canSave">
          {{ saving ? 'Saving…' : 'Save value' }}
        </button>
      </form>
    </section>

    <section class="body-detail-card body-history-card">
      <p class="body-section-label">History</p>
      <p v-if="loading" class="body-status">Loading history…</p>
      <p v-else-if="!history.length" class="body-status">No data yet.</p>
      <div v-else class="body-history-list">
        <article v-for="record in history" :key="record.id" class="body-history-row">
          <strong>{{ displayValue(record) }}</strong>
          <span>{{ formatBodyEntryDate(record) }}</span>
        </article>
      </div>
    </section>
  </div>
</template>
