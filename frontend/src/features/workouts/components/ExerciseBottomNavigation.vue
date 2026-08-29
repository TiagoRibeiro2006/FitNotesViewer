<script setup>
import BaseBottomBar from '../../../shared/components/BaseBottomBar.vue'
import BaseBottomBarItem from '../../../shared/components/BaseBottomBarItem.vue'

defineProps({
  selectedOption: { type: String, default: '' },
})

const emit = defineEmits(['select'])
</script>

<template>
  <BaseBottomBar class="exercise-bottom-navigation" aria-label="Exercise tools" :columns="3" contained>
    <BaseBottomBarItem label="History" toggle :active="selectedOption === 'history'" @select="emit('select', 'history')">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" />
        </svg>
      </template>
    </BaseBottomBarItem>

    <BaseBottomBarItem label="Records" toggle :active="selectedOption === 'records'" @select="emit('select', 'records')">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
      </template>
    </BaseBottomBarItem>

    <BaseBottomBarItem label="1RM Calc" toggle :active="selectedOption === 'one-rep-max'" @select="emit('select', 'one-rep-max')">
      <template #icon>
        <svg class="exercise-bottom-navigation-number" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <text x="12" y="16" text-anchor="middle">1</text>
        </svg>
      </template>
    </BaseBottomBarItem>
  </BaseBottomBar>
</template>
