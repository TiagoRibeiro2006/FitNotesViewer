<script setup>
defineProps({
  label: { type: String, required: true },
  description: { type: String, required: true },
  enabled: { type: Boolean, required: true },
})
const emit = defineEmits(['toggle'])

function toggle() { emit('toggle') }
</script>

<template>
  <div class="settings-toggle-row">
    <div><strong>{{ label }}</strong><p>{{ description }}</p></div>
    <button class="settings-toggle" type="button" role="switch" :aria-label="label" :aria-checked="enabled" @click="toggle"><span></span></button>
  </div>
</template>

<style scoped>
.settings-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 0; border-bottom: 1px solid var(--theme-border, #242424); }
.settings-toggle-row strong { color: var(--theme-text-primary, #f5f5f5); font-size: 15px; }
.settings-toggle-row p { margin: 5px 0 0; color: var(--theme-text-muted, #777780); font-size: 13px; line-height: 1.45; }
.settings-toggle { position: relative; display: flex; align-items: center; flex-shrink: 0; width: 52px; height: 44px; padding: 0 4px; border: 0; border-radius: 22px; background: transparent; cursor: pointer; }
.settings-toggle::before { content: ''; position: absolute; inset: 6px 0; border-radius: 999px; background: var(--theme-surface-muted, #34343a); }
.settings-toggle span { position: relative; width: 24px; height: 24px; border-radius: 50%; background: #fff; transform: translateX(0); transition: transform .15s ease; }
.settings-toggle[aria-checked='true']::before { background: var(--accent-colour, #3f96ff); }
.settings-toggle[aria-checked='true'] span { transform: translateX(20px); }
.settings-toggle:focus-visible { outline: 2px solid var(--accent-colour, #62adff); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .settings-toggle span { transition: none; } }
</style>
