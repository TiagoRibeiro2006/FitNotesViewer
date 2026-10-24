<script setup>
import MuscleIndicator from '../../../shared/components/MuscleIndicator.vue'
import { useBodyIconColour } from '../../../shared/composables/useBodyIconColour.js'

const emit = defineEmits(['manage-body-items'])
const { bodyIconColour, preference, setBodyIconColour } = useBodyIconColour()

function followAccent() { setBodyIconColour('accent') }
function useCustom() { setBodyIconColour('custom') }
function changeColour(event) { setBodyIconColour('custom', event.target.value) }
function manageBodyItems() { emit('manage-body-items') }
</script>

<template>
  <section aria-label="Body settings">
    <h3 class="settings-body-title">Body icon colour</h3>
    <p class="settings-unit-description">Follow your accent colour or choose a separate colour for Body icons.</p>
    <div class="settings-unit-options" role="group" aria-label="Body icon colour">
      <button class="settings-unit-option" type="button" :class="{ 'is-selected': preference.mode === 'accent' }" :aria-pressed="preference.mode === 'accent'" @click="followAccent">Follow accent</button>
      <button class="settings-unit-option" type="button" :class="{ 'is-selected': preference.mode === 'custom' }" :aria-pressed="preference.mode === 'custom'" @click="useCustom">Custom colour</button>
    </div>
    <label v-if="preference.mode === 'custom'" class="settings-accent-custom"><span>Custom icon colour</span><input type="color" :value="preference.customColour" aria-label="Custom Body icon colour" @input="changeColour" /><strong>{{ preference.customColour.toUpperCase() }}</strong></label>
    <div class="settings-body-preview" :style="{ '--category-color': bodyIconColour }"><MuscleIndicator icon-id="abs" preview /><MuscleIndicator icon-id="body-fat" preview /><MuscleIndicator icon-id="body-weight" preview /><span>Icon preview</span></div>
    <div class="settings-data-action">
      <div><strong>Manage body items</strong><p>Rename, add or remove body measurements and choose their icons.</p></div>
      <button class="settings-export-button" type="button" @click="manageBodyItems">Open body items</button>
    </div>
  </section>
</template>

<style scoped>
.settings-body-title { margin: 0 0 12px; color: var(--theme-text-primary, #fff); font-size: 17px; }
.settings-body-preview { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding: 14px; border: 1px solid var(--theme-border, #29292e); border-radius: var(--box-radius); background: var(--theme-surface-raised, #18181c); }
.settings-body-preview span { margin-left: auto; color: var(--theme-text-muted, #85858f); font-size: 12px; }
</style>
