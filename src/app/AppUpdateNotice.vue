<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

const emit = defineEmits(['close'])
let dismissTimer

onMounted(() => {
  dismissTimer = window.setTimeout(() => emit('close'), 4500)
})

onBeforeUnmount(() => window.clearTimeout(dismissTimer))
</script>

<template>
  <p class="app-update-notice" role="status">
    App updated successfully.
  </p>
</template>

<style scoped>
.app-update-notice {
  position: fixed;
  z-index: 90;
  right: max(16px, env(safe-area-inset-right));
  bottom: calc(92px + env(safe-area-inset-bottom));
  left: max(16px, env(safe-area-inset-left));
  width: fit-content;
  max-width: calc(100% - 32px);
  margin: 0 auto;
  padding: 11px 14px;
  border: 1px solid #347f59;
  border-radius: var(--box-radius);
  background: #13271d;
  box-shadow: 0 12px 30px rgba(0, 0, 0, .4);
  color: #70d69b;
  font-size: 13px;
  font-weight: 750;
  text-align: center;
}
</style>
