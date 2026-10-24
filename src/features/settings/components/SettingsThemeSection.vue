<script setup>
import { useTheme } from '../../../shared/composables/useTheme.js'

const { themes, selectedTheme, setTheme } = useTheme()

function selectTheme(event) {
  setTheme(event.currentTarget.dataset.theme)
}
</script>

<template>
  <section class="settings-theme-section" aria-label="App theme">
    <p class="settings-unit-description">Choose a look for the whole app. Your choice is saved on this device.</p>
    <div class="settings-theme-options" role="group" aria-label="Theme">
      <button v-for="theme in themes" :key="theme.id" class="settings-theme-option" type="button" :data-theme="theme.id" :aria-pressed="selectedTheme === theme.id" @click="selectTheme">
        <span class="settings-theme-sample" :class="'theme-sample-' + theme.id" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="settings-theme-copy"><strong>{{ theme.label }}</strong><small>{{ theme.description }}</small></span>
        <span class="settings-theme-check" aria-hidden="true">{{ selectedTheme === theme.id ? '✓' : '' }}</span>
      </button>
    </div>
  </section>
</template>
