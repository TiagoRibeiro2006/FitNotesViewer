<script setup>
import { useMuscleAppearance } from '../../../shared/composables/useMuscleAppearance.js'

const { iconsEnabled, setIconsEnabled } = useMuscleAppearance()

function showIcons() {
  setIconsEnabled(true)
}

function showColours() {
  setIconsEnabled(false)
}
</script>

<template>
  <section class="settings-card">
    <div class="settings-section-heading">
      <div>
        <p class="eyebrow">PREFERENCES</p>
        <h2>Appearance</h2>
      </div>
    </div>
    <p class="settings-unit-description">Choose how muscles are displayed.</p>
    <div class="settings-unit-options" role="group" aria-label="Muscle appearance">
      <button class="settings-unit-option" :class="{ 'is-selected': iconsEnabled }" type="button" :aria-pressed="iconsEnabled" @click="showIcons">Muscle icons</button>
      <button class="settings-unit-option" :class="{ 'is-selected': !iconsEnabled }" type="button" :aria-pressed="!iconsEnabled" @click="showColours">Colours only</button>
    </div>
  </section>
</template>
