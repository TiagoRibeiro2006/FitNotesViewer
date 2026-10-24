<script setup>
import { ref } from 'vue'
import ActionModal from '../../../shared/components/ActionModal.vue'
import SettingsNavigationRow from './SettingsNavigationRow.vue'

const open = ref(false)
const section = {
  id: 'about',
  title: 'About the app',
  description: 'Get to know FitNotesViewer',
  icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 11v6M12 7h.01',
}

function openAbout() { open.value = true }
function closeAbout() { open.value = false }
</script>

<template>
  <section class="settings-navigation settings-about" aria-label="About the app">
    <SettingsNavigationRow :section="section" @open="openAbout" />
  </section>
  <ActionModal :open="open" title="About the app" aria-label="About the app" modal-class="settings-detail-modal" layer-class="settings-detail-layer" @close="closeAbout">
    <div class="settings-about-content">
      <div class="settings-about-brand"><img src="/icons/icon-192.png" width="48" height="48" alt="" /><strong>FitNotesViewer</strong></div>
      <p>A free workout tracker for iOS and Android, inspired by the familiar simplicity of FitNotes. Log your training and find more ways to understand your progress.</p>
      <dl>
        <div><dt>Log your workouts</dt><dd>Add, edit, copy and organise your exercises and sets.</dd></div>
        <div><dt>Track your body</dt><dd>Follow your weight and other body measurements over time.</dd></div>
        <div><dt>See your progress</dt><dd>Explore training charts, muscle distribution and your workout calendar.</dd></div>
        <div><dt>Make it yours</dt><dd>Choose your theme, colours and icons, and adjust what you see.</dd></div>
      </dl>
      <h3>Your data, your choice</h3>
      <p>Bring your history from FitNotes with a .fitnotes backup or .csv export, and export your data whenever you need it. Your information stays on your device, and the app keeps working offline.</p>
      <h3>Privacy comes first</h3>
      <p>We do not collect or store personal information about you. Your workouts, measurements and preferences stay locally on your device, under your control. Your privacy always comes first.</p>
      <p class="settings-about-disclaimer">FitNotesViewer is an independent project and is not affiliated with FitNotes.</p>
    </div>
  </ActionModal>
</template>

<style scoped>
.settings-about-content { color: var(--theme-text-secondary, #b5b5bf); }
.settings-about-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.settings-about-brand img { border-radius: 12px; }
.settings-about-brand strong { color: var(--theme-text-primary, #fff); font-size: 20px; }
.settings-about-content dl { display: grid; gap: 15px; margin: 20px 0; }
.settings-about-content dt { color: var(--theme-text-primary, #fff); font-weight: 750; }
.settings-about-content dd { margin: 4px 0 0; }
.settings-about-content h3 { margin: 20px 0 8px; color: var(--theme-text-primary, #fff); font-size: 16px; }
.settings-about-disclaimer { padding-top: 16px; border-top: 1px solid var(--theme-border, #29292e); color: var(--theme-text-muted, #85858f); font-size: 12px; }
</style>
