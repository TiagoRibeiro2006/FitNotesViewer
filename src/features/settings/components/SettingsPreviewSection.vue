<script setup>
import { computed } from 'vue'

const props = defineProps({ section: { type: String, required: true } })
const optionsBySection = {
  home: [
    { title: 'Set progress indicators', description: 'Show or hide the progress indicators next to your sets.', value: 'Show / Hide' },
  ],
  body: [
    { title: 'Body icon colour', description: 'Follow the accent colour or choose a separate colour for Body icons.', value: 'Accent / Custom', colour: '#4b9cff' },
  ],
}
const options = computed(readOptions)

function readOptions() {
  return optionsBySection[props.section] ?? []
}
</script>

<template>
  <div class="settings-preview-options">
    <p class="settings-preview-note">Preview only. These options are not available yet.</p>
    <button v-for="option in options" :key="option.title" class="settings-preview-option" type="button" disabled>
      <span class="settings-preview-copy">
        <strong>{{ option.title }}</strong>
        <small>{{ option.description }}</small>
        <span class="settings-preview-value"><i v-if="option.colour" :style="{ background: option.colour }"></i>{{ option.value }}</span>
      </span>
      <span class="settings-preview-badge">Coming soon</span>
    </button>
  </div>
</template>
