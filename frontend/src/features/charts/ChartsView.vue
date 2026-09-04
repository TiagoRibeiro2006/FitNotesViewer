<script setup>
import { onMounted, ref } from 'vue'
import AppSectionHeader from '../../shared/components/AppSectionHeader.vue'
import BodyAnalyticsPanel from './components/BodyAnalyticsPanel.vue'
import TrainingAiPanel from './components/TrainingAiPanel.vue'
import TrainingAnalyticsPanel from './components/TrainingAnalyticsPanel.vue'
import { useChartsData } from './composables/useChartsData.js'

const activeSection = ref('body')
const aiEnabled = ref(false)
const { data, error, loading, load } = useChartsData()

onMounted(initializeCharts)

async function initializeCharts() {
  await load()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function showBodyCharts() {
  activeSection.value = 'body'
}

function showTrainingCharts() {
  activeSection.value = 'training'
}

function toggleAi() {
  aiEnabled.value = !aiEnabled.value
}
</script>

<template>
  <AppSectionHeader title="Charts">
    <template #action>
      <button
        class="charts-ai-toggle"
        :class="{ 'is-active': aiEnabled }"
        type="button"
        :aria-pressed="aiEnabled"
        @click="toggleAi"
      >
        AI {{ aiEnabled ? 'ON' : 'OFF' }}
      </button>
    </template>
  </AppSectionHeader>

  <nav class="charts-section-tabs" aria-label="Chart category">
    <button
      type="button"
      :class="{ 'is-active': activeSection === 'body' }"
      @click="showBodyCharts"
    >
      Body
    </button>
    <button
      type="button"
      :class="{ 'is-active': activeSection === 'training' }"
      @click="showTrainingCharts"
    >
      Training
    </button>
  </nav>

  <section v-if="loading" class="charts-status-card">
    <span class="charts-loading-indicator" aria-hidden="true"></span>
    <strong>Building your analytics</strong>
    <p>Reading your measurements and workout history…</p>
  </section>

  <section v-else-if="error" class="charts-status-card charts-status-error">
    <strong>Charts are unavailable</strong>
    <p>{{ error }}</p>
    <button type="button" @click="load">Try again</button>
  </section>

  <BodyAnalyticsPanel
    v-else-if="activeSection === 'body'"
    :measurements="data.bodyMeasurements"
  />

  <TrainingAiPanel v-else-if="aiEnabled" :data="data" />

  <TrainingAnalyticsPanel v-else :data="data" />
</template>
