<script setup>
defineProps({
  active: { type: Boolean, required: true },
})

const emit = defineEmits(['toggle'])

function toggle() {
  emit('toggle')
}
</script>

<template>
  <button
    class="ai-mode-toggle"
    :class="{ 'is-active': active }"
    type="button"
    :aria-pressed="active"
    @click="toggle"
  >
    AI {{ active ? 'ON' : 'OFF' }}
  </button>
</template>

<style scoped>
.ai-mode-toggle {
  min-width: 66px;
  height: 34px;
  padding: 0 11px;
  border: 1px solid #34343a;
  border-radius: 999px;
  background: #17171a;
  color: #7d7d86;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .04em;
  cursor: pointer;
}

.ai-mode-toggle.is-active {
  border-color: #3f96ff;
  background: #142238;
  color: #62adff;
}

.ai-mode-toggle:active {
  transform: scale(.97);
}
</style>
