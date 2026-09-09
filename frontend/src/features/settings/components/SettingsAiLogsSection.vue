<script setup>
const emit = defineEmits(['open-logs'])

function openLogs() {
  emit('open-logs')
}
</script>

<template>
  <section class="settings-card">
    <div class="settings-section-heading">
      <div>
        <p class="eyebrow">AI</p>
        <h2>Training conversations</h2>
      </div>
    </div>

    <div class="settings-data-action settings-data-action-first">
      <div>
        <strong>Check AI logs</strong>
        <p>Open a recent conversation or start a new Training AI chat.</p>
      </div>
      <button class="settings-export-button" type="button" @click="openLogs">
        Check AI logs
      </button>
    </div>
  </section>
</template>
