<script setup>
import { androidColorToCss } from '../../../shared/utils/colors'
import { exerciseMeta } from '../exerciseFormatters'

defineProps({
  categories: { type: Array, required: true },
  exercises: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  selectedCategoryId: { default: null },
})

const emit = defineEmits([
  'select',
  'update:search-query',
  'update:selected-category-id',
])

function updateSearch(event) {
  emit('update:search-query', event.target.value)
}

function selectAllCategories() {
  emit('update:selected-category-id', null)
}

function toggleCategory(categoryId, selectedCategoryId) {
  const nextCategoryId = selectedCategoryId === categoryId ? null : categoryId
  emit('update:selected-category-id', nextCategoryId)
}

function categoryStyle(category) {
  return { '--category-color': androidColorToCss(category?.colour) }
}

function exerciseStyle(exercise) {
  return { '--category-color': androidColorToCss(exercise?.categoryColor) }
}
</script>

<template>
  <div class="exercise-picker-controls">
    <label class="search-field">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        :value="searchQuery"
        type="search"
        placeholder="Search exercises"
        autocomplete="off"
        @input="updateSearch"
      />
    </label>

    <div class="category-strip" aria-label="Exercise categories">
      <button
        class="category-chip"
        :class="{ 'is-selected': selectedCategoryId === null }"
        type="button"
        @click="selectAllCategories"
      >
        All
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-chip"
        :class="{ 'is-selected': selectedCategoryId === category.id }"
        :style="categoryStyle(category)"
        type="button"
        @click="toggleCategory(category.id, selectedCategoryId)"
      >
        <span class="category-dot"></span>
        {{ category.name }}
      </button>
    </div>
  </div>

  <div v-if="loading" class="modal-list-status">Loading exercises…</div>
  <div v-else-if="!exercises.length" class="modal-list-status">No exercises available yet.</div>

  <div v-else class="exercise-picker-list">
    <button
      v-for="exercise in exercises"
      :key="exercise.id"
      class="exercise-picker-row"
      :style="exerciseStyle(exercise)"
      type="button"
      @click="emit('select', exercise)"
    >
      <span class="exercise-color-dot"></span>
      <span class="exercise-picker-copy">
        <strong>{{ exercise.name }}</strong>
        <small>{{ exercise.categoryName }} · {{ exerciseMeta(exercise) }}</small>
      </span>
      <span class="exercise-chevron">›</span>
    </button>
  </div>
</template>
