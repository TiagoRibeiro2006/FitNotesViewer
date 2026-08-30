<script setup>
import BaseBottomBar from '../shared/components/BaseBottomBar.vue'
import BaseBottomBarItem from '../shared/components/BaseBottomBarItem.vue'

defineProps({
  activeView: { type: String, required: true },
})

const emit = defineEmits(['navigate'])
</script>

<template>
  <BaseBottomBar class="app-bottom-navigation" aria-label="App navigation" :columns="5">
    <BaseBottomBarItem label="Body" :active="activeView === 'body'" @select="emit('navigate', 'body')">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2.25" />
          <path d="M8.5 10.2c.9-1.7 2-2.7 3.5-2.7s2.6 1 3.5 2.7M9 10.5l-1 4.5m7-4.5 1 4.5M10.4 13.5 10 21m3.6-7.5.4 7.5" />
        </svg>
      </template>
    </BaseBottomBarItem>

    <BaseBottomBarItem label="Calendar" :active="activeView === 'calendar'" @select="emit('navigate', 'calendar')">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
          <path d="M7.5 3.5v4m9-4v4M3.5 10h17" />
        </svg>
      </template>
    </BaseBottomBarItem>

    <BaseBottomBarItem label="Log" :active="activeView === 'workouts'" @select="emit('navigate', 'workouts')">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="9.5" width="3" height="5" rx=".75" />
          <rect x="5.5" y="7.5" width="3" height="9" rx=".75" />
          <path d="M8.5 12h7" />
          <rect x="15.5" y="7.5" width="3" height="9" rx=".75" />
          <rect x="18.5" y="9.5" width="3" height="5" rx=".75" />
        </svg>
      </template>
    </BaseBottomBarItem>

    <BaseBottomBarItem label="Charts" disabled>
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20V10m5 10V4m6 16v-7m5 7V7" />
        </svg>
      </template>
    </BaseBottomBarItem>

    <BaseBottomBarItem label="Settings" :active="activeView === 'settings'" @select="emit('navigate', 'settings')">
      <template #icon>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.16.38.5.72.91.88.2.08.41.12.63.12H21v4h-.09c-.66 0-1.26.4-1.51 1Z" />
        </svg>
      </template>
    </BaseBottomBarItem>
  </BaseBottomBar>
</template>
