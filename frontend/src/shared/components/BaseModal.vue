<script setup>
defineProps({
  open: { type: Boolean, required: true },
  ariaLabel: { type: String, required: true },
  layerClass: { type: String, default: '' },
  modalClass: { type: String, default: '' },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-layer" :class="layerClass" @click.self="emit('close')">
      <section class="workout-modal" :class="modalClass" role="dialog" aria-modal="true" :aria-label="ariaLabel">
        <slot />
      </section>
    </div>
  </Teleport>
</template>
