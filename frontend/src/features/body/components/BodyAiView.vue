<script setup>
import { onMounted } from 'vue'
import BodyAiResult from './BodyAiResult.vue'
import BodyWeightAssignmentView from './BodyWeightAssignmentView.vue'
import { useBodyAiAnalysis } from '../composables/useBodyAiAnalysis.js'
import { useBodyWeightAssignment } from '../composables/useBodyWeightAssignment.js'
import DateRangeControl from '../../charts/components/DateRangeControl.vue'
import { useChartDateInterval } from '../../charts/composables/useChartDateInterval.js'

const goals = [
  { id: 'cutting', label: 'Cutting', description: 'Lose weight', direction: 'down' },
  { id: 'maintenance', label: 'Maintenance', description: 'Stay stable', direction: 'steady' },
  { id: 'bulking', label: 'Bulking', description: 'Gain weight', direction: 'up' },
]

const { startDate: selectedStartDate, endDate: selectedEndDate } = useChartDateInterval()
const {
  analysis,
  analysisIsCurrent,
  error,
  generateAnalysis,
  loading,
  resetAnalysis,
  selectedGoal,
  selectGoal,
} = useBodyAiAnalysis(selectedStartDate, selectedEndDate)
const {
  assigning,
  bodyWeight,
  candidates,
  closeAssignment,
  confirmAssignment,
  error: assignmentError,
  load: loadAssignment,
  loading: assignmentLoading,
  needsAssignment,
  openAssignment,
  saving: assignmentSaving,
  selectCandidate,
  selectedId,
} = useBodyWeightAssignment()

onMounted(loadAssignment)

async function saveAssignment() {
  if (await confirmAssignment()) resetAnalysis()
}
</script>

<template>
  <BodyWeightAssignmentView
    v-if="assigning"
    :candidates="candidates"
    :error="assignmentError"
    :saving="assignmentSaving"
    :selected-id="selectedId"
    @close="closeAssignment"
    @confirm="saveAssignment"
    @select="selectCandidate"
  />

  <div v-else class="body-ai-view" aria-label="Body AI">
    <section class="body-ai-card body-ai-setup-card">
      <div class="body-ai-heading">
        <div>
          <p class="eyebrow">BODY AI</p>
          <h2>Weight direction</h2>
        </div>
        <span class="body-ai-local-badge">On device</span>
      </div>

      <p class="body-ai-description">
        Choose your current goal so the analysis can judge your Body Weight trend in the right context.
      </p>

      <div class="body-ai-goals" role="radiogroup" aria-label="Current weight goal">
        <button
          v-for="goal in goals"
          :key="goal.id"
          class="body-ai-goal"
          :class="{ 'is-selected': selectedGoal === goal.id }"
          type="button"
          role="radio"
          :aria-checked="selectedGoal === goal.id"
          @click="selectGoal(goal.id)"
        >
          <span class="body-ai-goal-icon" :class="`is-${goal.direction}`" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path v-if="goal.direction === 'steady'" d="M6 12h12" />
              <path v-else-if="goal.direction === 'down'" d="m7 9 5 5 5-5" />
              <path v-else d="m7 15 5-5 5 5" />
            </svg>
          </span>
          <strong>{{ goal.label }}</strong>
          <small>{{ goal.description }}</small>
        </button>
      </div>

      <div class="chart-range-control body-ai-range-control">
        <span>Analysis period</span>
        <DateRangeControl
          v-model:start-date="selectedStartDate"
          v-model:end-date="selectedEndDate"
          action-label="Analyse"
          :action-disabled="!selectedGoal || loading || analysisIsCurrent || assignmentLoading || !bodyWeight"
          @apply="generateAnalysis"
        />
      </div>

      <div v-if="needsAssignment" class="body-ai-assignment-note">
        <div class="body-ai-assignment-copy">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4v16M4 12h16" />
          </svg>
          <span>
            <strong>Body Weight is not assigned</strong>
            <small>Choose one of your kg measurements so Body AI knows which data to analyse.</small>
          </span>
        </div>
        <button type="button" @click="openAssignment">Assign Body Weight</button>
      </div>

      <div v-else class="body-ai-data-note">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
          <path d="m9.5 12 1.7 1.7 3.5-4" />
        </svg>
        <span>
          {{ assignmentLoading ? 'Checking Body Weight source…' : `Using ${bodyWeight?.name || 'Body Weight'} for this analysis.` }}
        </span>
      </div>

      <p v-if="assignmentError && !assigning" class="body-ai-result-error body-ai-assignment-error">
        {{ assignmentError }}
      </p>
    </section>

    <BodyAiResult :analysis="analysis" :error="error" />
  </div>
</template>
