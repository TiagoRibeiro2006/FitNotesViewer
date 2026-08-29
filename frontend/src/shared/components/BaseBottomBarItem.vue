<script setup>
defineProps({
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  label: { type: String, required: true },
  toggle: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])
</script>

<template>
  <button
    class="base-bottom-bar-item"
    :class="{ 'is-active': active }"
    type="button"
    :aria-label="label"
    :aria-current="active && !toggle ? 'page' : undefined"
    :aria-pressed="toggle ? active : undefined"
    :disabled="disabled"
    @click="emit('select')"
  >
    <slot name="icon" />
    <span>{{ label }}</span>
  </button>
</template>
