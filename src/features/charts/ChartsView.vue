<script setup>
import { onMounted } from 'vue'
import AppSectionHeader from '../../shared/components/AppSectionHeader.vue'
import BodyAnalyticsPanel from './components/BodyAnalyticsPanel.vue'
import TrainingAnalyticsPanel from './components/TrainingAnalyticsPanel.vue'
import { useChartsData } from './composables/useChartsData.js'
import { useChartSectionPreference } from './composables/useChartSectionPreference.js'

const { activeSection, selectSection } = useChartSectionPreference()
const { data, error, loading, load } = useChartsData()

onMounted(initializeCharts)

async function initializeCharts() {
  await load()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

</script>

<template>
  <AppSectionHeader title="Charts" />

  <nav class="charts-section-tabs" aria-label="Chart category">
    <button
      type="button"
      :class="{ 'is-active': activeSection === 'body' }"
      :aria-pressed="activeSection === 'body'"
      @click="selectSection('body')"
    >
      Body
    </button>
    <button
      type="button"
      :class="{ 'is-active': activeSection === 'training' }"
      :aria-pressed="activeSection === 'training'"
      @click="selectSection('training')"
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

  <TrainingAnalyticsPanel v-else :data="data" />
</template>

<style scoped>
.charts-section-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 18px;
  padding: 4px;
  border: 1px solid #242424;
  border-radius: var(--box-radius);
  background: #101010;
}

.charts-section-tabs button {
  min-height: 44px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #777780;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.charts-section-tabs button.is-active {
  background: #242428;
  color: #fff;
}

.charts-status-card {
  min-height: 230px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 32px;
  border: 1px solid #242424;
  border-radius: var(--box-radius);
  background: #101010;
  text-align: center;
}

.charts-status-card strong {
  margin: 0 0 8px;
  color: #fff;
  font-size: 22px;
}

.charts-status-card p {
  max-width: 430px;
  margin: 0;
  color: #85858e;
  font-size: 14px;
  line-height: 1.5;
}

.charts-loading-indicator {
  width: 30px;
  height: 30px;
  margin-bottom: 18px;
  border: 3px solid #24242a;
  border-top-color: #3f96ff;
  border-radius: 50%;
  animation: charts-spin .8s linear infinite;
}

.charts-status-error strong,
.charts-status-error p {
  color: #ff7066;
}

.charts-status-error button {
  min-height: 42px;
  margin-top: 18px;
  padding: 0 18px;
  border: 1px solid #34343a;
  border-radius: 6px;
  background: #1c1c20;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}

@keyframes charts-spin {
  to { transform: rotate(360deg); }
}
</style>
