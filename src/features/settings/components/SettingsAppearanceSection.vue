<script setup>
import { useMuscleAppearance } from '../../../shared/composables/useMuscleAppearance.js'

const { iconsEnabled, homeIndicatorsEnabled, setIconsEnabled, setHomeIndicatorsEnabled } = useMuscleAppearance()

function showIcons() {
  setIconsEnabled(true)
}

function showColours() {
  setIconsEnabled(false)
}

function toggleHomeIndicators() {
  setHomeIndicatorsEnabled(!homeIndicatorsEnabled.value)
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
    <div class="appearance-home-option">
      <div>
        <strong id="home-indicators-label">Show on Home</strong>
        <p>Show muscle icons or colours on Home and Change Order.</p>
      </div>
      <button
        class="appearance-switch"
        type="button"
        role="switch"
        aria-labelledby="home-indicators-label"
        :aria-checked="homeIndicatorsEnabled"
        @click="toggleHomeIndicators"
      ><span></span></button>
    </div>
  </section>
</template>

<style scoped>
.appearance-home-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #242424;
}
.appearance-home-option strong {
  color: #f5f5f5;
  font-size: 15px;
}
.appearance-home-option p {
  margin: 5px 0 0;
  color: #777780;
  font-size: 13px;
  line-height: 1.45;
}
.appearance-switch {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 52px;
  height: 44px;
  padding: 0 4px;
  border: 0;
  border-radius: 22px;
  background: transparent;
  cursor: pointer;
}
.appearance-switch::before {
  content: '';
  position: absolute;
  inset: 6px 0;
  border-radius: 999px;
  background: #34343a;
}
.appearance-switch span {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  transform: translateX(0);
  transition: transform .15s ease;
}
.appearance-switch[aria-checked='true']::before {
  background: #3f96ff;
}
.appearance-switch[aria-checked='true'] span {
  transform: translateX(20px);
}
.appearance-switch:focus-visible {
  outline: 2px solid #62adff;
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .appearance-switch span { transition: none; }
}
</style>
