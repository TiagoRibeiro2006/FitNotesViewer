<script setup>
import { useAccentColour } from '../../../shared/composables/useAccentColour.js'

const { accentColour, colours, setAccentColour } = useAccentColour()

function selectColour(event) {
  setAccentColour(event.currentTarget.dataset.colour)
}

function selectCustomColour(event) {
  setAccentColour(event.target.value)
}
</script>

<template>
  <section class="settings-accent-section" aria-label="Accent colour">
    <h3>Accent colour</h3>
    <p class="settings-unit-description">Personalise buttons, switches, favourites and selections. Muscle colours stay unchanged.</p>
    <div class="settings-accent-options" role="group" aria-label="Accent colours">
      <button v-for="option in colours" :key="option.colour" class="settings-accent-option" type="button" :data-colour="option.colour" :aria-label="option.name" :aria-pressed="accentColour === option.colour" @click="selectColour">
        <span :style="{ background: option.colour }" aria-hidden="true"></span>
        <small>{{ option.name }}</small>
      </button>
    </div>
    <label class="settings-accent-custom"><span>Custom colour</span><input type="color" :value="accentColour" aria-label="Custom accent colour" @input="selectCustomColour" /><strong>{{ accentColour.toUpperCase() }}</strong></label>
  </section>
</template>
