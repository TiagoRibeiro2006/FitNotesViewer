<script setup>
import BaseModal from '../../../shared/components/BaseModal.vue'

defineProps({
  open: { type: Boolean, required: true },
  categories: { type: Array, required: true },
})

const emit = defineEmits(['close'])

function closeModal() {
  emit('close')
}

function categoryClass(category) {
  return 'is-' + category.level
}
</script>

<template>
  <BaseModal
    :open="open"
    aria-label="Training analysis details"
    layer-class="training-details-layer"
    modal-class="training-details-modal"
    @close="closeModal"
  >
    <header class="training-details-header">
      <div>
        <p class="eyebrow">AI ANALYSIS</p>
        <h2>Training details</h2>
      </div>
      <button type="button" aria-label="Close training details" @click="closeModal">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </header>

    <div class="training-details-content">
      <p class="training-details-intro">
        A closer look at the main qualities considered in this training review.
      </p>

      <div v-if="categories.length" class="training-details-list">
        <article
          v-for="category in categories"
          :key="category.id"
          class="training-details-item"
          :class="categoryClass(category)"
        >
          <div class="training-details-item-heading">
            <strong>{{ category.label }}</strong>
            <b>{{ category.score }}/10</b>
          </div>
          <div class="training-details-track" aria-hidden="true">
            <i :style="{ width: category.score * 10 + '%' }"></i>
          </div>
          <p>{{ category.summary }}</p>
        </article>
      </div>

      <p v-else class="training-details-empty">
        Category ratings will appear after the analysis is generated.
      </p>
    </div>
  </BaseModal>
</template>
