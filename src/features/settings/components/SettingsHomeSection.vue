<script setup>
import SettingsToggleRow from './SettingsToggleRow.vue'
import { useProgressAppearance } from '../../../shared/composables/useProgressAppearance.js'

const { homeProgressEnabled, editorProgressEnabled, setHomeProgressEnabled, setEditorProgressEnabled } = useProgressAppearance()

function toggleHome() { setHomeProgressEnabled(!homeProgressEnabled.value) }
function toggleEditor() { setEditorProgressEnabled(!editorProgressEnabled.value) }
</script>

<template>
  <p class="settings-unit-description">Choose where progress stars appear. Progress is still calculated and saved when stars are hidden.</p>
  <SettingsToggleRow label="Progress stars on Home" description="Show a star instead of the set number when a set marks progress." :enabled="homeProgressEnabled" @toggle="toggleHome" />
  <SettingsToggleRow label="Progress stars in Log / Edit Exercise" description="Show progress stars while logging or editing sets, including the exercise history." :enabled="editorProgressEnabled" @toggle="toggleEditor" />
</template>
