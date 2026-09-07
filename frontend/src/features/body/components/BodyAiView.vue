<script setup>
import BodyAiResult from './BodyAiResult.vue'
import { useBodyAiAnalysis } from '../composables/useBodyAiAnalysis.js'

const goals = [
  { id: 'cutting', label: 'Cutting', description: 'Lose weight', direction: 'down' },
  { id: 'maintenance', label: 'Maintenance', description: 'Stay stable', direction: 'steady' },
  { id: 'bulking', label: 'Bulking', description: 'Gain weight', direction: 'up' },
]

const {
  analysis,
  error,
  generateAnalysis,
  loading,
  selectedGoal,
  selectGoal,
} = useBodyAiAnalysis()
</script>

<template>
  <div class="body-ai-view" aria-label="Body AI">
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

      <div class="body-ai-data-note">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3Z" />
          <path d="m9.5 12 1.7 1.7 3.5-4" />
        </svg>
        <span>Only your locally stored Body Weight values will be analysed.</span>
      </div>

      <button
        class="body-ai-generate"
        type="button"
        :disabled="!selectedGoal || loading"
        @click="generateAnalysis"
      >
        {{ loading ? 'Analysing…' : 'Analyse body weight' }}
      </button>
    </section>

    <BodyAiResult :analysis="analysis" :error="error" />
  </div>
</template>
