<script setup>
import { androidColorToCss } from '../../../shared/utils/colors'

defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  mode: { type: String, required: true },
  searchQuery: { type: String, default: '' },
})

const emit = defineEmits(['select', 'update:search-query'])

function updateSearch(event) {
  emit('update:search-query', event.target.value)
}

function itemStyle(item, mode) {
  const colour = mode === 'muscles' ? item.colour : item.categoryColor
  return { '--category-color': androidColorToCss(colour) }
}

function subtitle(item, mode) {
  return mode === 'muscles' ? 'Muscle' : item.categoryName
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
        :placeholder="mode === 'muscles' ? 'Search muscles' : 'Search exercises'"
        autocomplete="off"
        @input="updateSearch"
      />
    </label>
  </div>

  <div v-if="loading" class="modal-list-status">Loading…</div>
  <div v-else-if="!items.length" class="modal-list-status">No results found.</div>

  <div v-else class="exercise-picker-list">
    <button
      v-for="item in items"
      :key="item.id"
      class="exercise-picker-row"
      :style="itemStyle(item, mode)"
      type="button"
      @click="emit('select', item)"
    >
      <span class="exercise-color-dot"></span>
      <span class="exercise-picker-copy">
        <strong>{{ item.name }}</strong>
        <small>{{ subtitle(item, mode) }}</small>
      </span>
      <span class="exercise-chevron">›</span>
    </button>
  </div>
</template>
