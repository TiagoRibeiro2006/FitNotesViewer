<script setup>
const props = defineProps({ section: { type: Object, required: true } })
const emit = defineEmits(['open'])

function open() {
  emit('open', props.section.id)
}
</script>

<template>
  <button class="settings-navigation-row" type="button" aria-haspopup="dialog" @click="open">
    <span class="settings-navigation-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="section.icon" /></svg>
    </span>
    <span class="settings-navigation-copy">
      <strong>{{ section.title }}</strong>
      <small>{{ section.description }}</small>
    </span>
    <svg class="settings-navigation-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
  </button>
</template>
