<script setup>
import { ref } from 'vue'

const selectedGoal = ref('')

const goals = [
  { id: 'cutting', label: 'Cutting', description: 'Lose weight', direction: 'down' },
  { id: 'maintenance', label: 'Maintenance', description: 'Stay stable', direction: 'steady' },
  { id: 'bulking', label: 'Bulking', description: 'Gain weight', direction: 'up' },
]

function selectGoal(goalId) {
  selectedGoal.value = goalId
}
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

      <button class="body-ai-generate" type="button" :disabled="!selectedGoal">
        Analyse body weight
      </button>
    </section>

    <section class="body-ai-card body-ai-result-card">
      <div class="body-ai-result-heading">
        <div>
          <p class="eyebrow">AI REVIEW</p>
          <h2>Your progress</h2>
        </div>
        <span class="body-ai-rating">—</span>
      </div>

      <div class="body-ai-empty-result">
        <span class="body-ai-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 17 9 12l4 3 7-9" />
            <circle cx="4" cy="17" r="1.4" />
            <circle cx="9" cy="12" r="1.4" />
            <circle cx="13" cy="15" r="1.4" />
            <circle cx="20" cy="6" r="1.4" />
          </svg>
        </span>
        <strong>Ready when you are</strong>
        <p>Select your goal and generate an analysis to see whether your weight trend is on track.</p>
      </div>

      <div class="body-ai-preview-metrics" aria-label="Future analysis details">
        <span><small>Trend</small><strong>—</strong></span>
        <span><small>Pace</small><strong>—</strong></span>
        <span><small>Consistency</small><strong>—</strong></span>
      </div>
    </section>
  </div>
</template>
