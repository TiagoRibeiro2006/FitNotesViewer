<script setup>
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <header class="section-sticky-header">
    <div class="section-sticky-header-inner">
      <h1>{{ title }}</h1>
    </div>
  </header>
</template>
