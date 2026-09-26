<script setup>
const props = defineProps({
  ariaLabel: { type: String, required: true },
  columns: { type: Number, default: 5 },
  contained: { type: Boolean, default: false },
})

function barStyle() {
  return { '--bottom-bar-columns': String(props.columns) }
}
</script>

<template>
  <nav
    class="base-bottom-bar"
    :class="{ 'is-contained': contained }"
    :style="barStyle()"
    :aria-label="ariaLabel"
  >
    <slot />
  </nav>
</template>
