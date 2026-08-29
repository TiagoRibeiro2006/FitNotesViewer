<script setup>
import { formatNumber } from '../../../shared/utils/numbers'
import { formatBodyEntryDate, formatBodyValue } from '../bodyFormatters'

defineProps({
  sections: { type: Array, required: true },
  favoritesSaving: { type: Boolean, default: false },
})

const emit = defineEmits(['open-measurement', 'toggle-favorite'])
</script>

<template>
  <div class="body-sections">
    <section v-for="section in sections" :key="section.id" class="body-section-card">
      <p class="body-section-label">{{ section.label }}</p>
      <p v-if="!section.items.length" class="body-status">{{ section.emptyMessage }}</p>

      <div v-else class="body-measurement-list">
        <article v-for="item in section.items" :key="item.id" class="body-measurement-row">
          <button class="body-measurement-copy" type="button" :aria-label="`Open ${item.name}`" @click="emit('open-measurement', item)">
            <span class="body-measurement-name">{{ item.name }}</span>
            <span class="body-measurement-value">
              <strong>{{ formatBodyValue(item) }}</strong>
              <span v-if="item.change !== null" class="body-measurement-change">
                {{ item.change < 0 ? '▼' : '▲' }} {{ formatNumber(Math.abs(item.change)) }}
              </span>
            </span>
            <small v-if="item.date">{{ formatBodyEntryDate(item) }}</small>
          </button>

          <button
            class="body-favorite-button"
            type="button"
            :aria-label="item.favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`"
            :aria-pressed="item.favorite"
            :disabled="favoritesSaving"
            @click="emit('toggle-favorite', item)"
          >
            <svg class="body-measurement-heart" :class="{ 'is-favorite': item.favorite }" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
            </svg>
          </button>
        </article>
      </div>
    </section>
  </div>
</template>
