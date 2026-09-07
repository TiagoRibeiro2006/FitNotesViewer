<script setup>
const props = defineProps({
  analysis: { type: Object, default: null },
  error: { type: String, default: '' },
})

function ratingClass() {
  const level = props.analysis?.rating?.level
  return level ? 'is-' + level : ''
}

function ratingLabel() {
  return props.analysis?.rating?.label ?? '—'
}

function trendLabel() {
  const labels = {
    gaining: 'Gaining',
    losing: 'Losing',
    stable: 'Stable',
  }
  return labels[props.analysis?.trend] ?? '—'
}

function paceLabel() {
  if (!props.analysis?.hasEnoughData) return '—'
  const value = props.analysis.weeklyChangePercent
  const sign = value > 0 ? '+' : ''
  return sign + formatNumber(value) + '% / week'
}

function consistencyLabel() {
  const labels = {
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
    limited: 'Limited',
  }
  return labels[props.analysis?.consistency] ?? '—'
}

function analysisRange() {
  if (!props.analysis?.firstDate || !props.analysis?.lastDate) return ''
  return formatDate(props.analysis.firstDate) + ' — ' + formatDate(props.analysis.lastDate)
}

function formatDate(dateKey) {
  const parts = dateKey.split('-').map(Number)
  const date = new Date(parts[0], parts[1] - 1, parts[2])
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-GB', { maximumFractionDigits: 2 })
}
</script>

<template>
  <section class="body-ai-card body-ai-result-card">
    <div class="body-ai-result-heading">
      <div>
        <p class="eyebrow">AI REVIEW</p>
        <h2>Your progress</h2>
      </div>
      <span class="body-ai-rating" :class="ratingClass()">{{ ratingLabel() }}</span>
    </div>

    <div v-if="error" class="body-ai-result-error">
      {{ error }}
    </div>

    <div v-else-if="analysis" class="body-ai-report" :class="ratingClass()">
      <p>{{ analysis.feedback }}</p>
      <small v-if="analysisRange()">
        {{ analysis.recordCount }} values · {{ analysisRange() }}
      </small>
    </div>

    <div v-else class="body-ai-empty-result">
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

    <div class="body-ai-preview-metrics" aria-label="Body Weight analysis details">
      <span><small>Trend</small><strong>{{ trendLabel() }}</strong></span>
      <span><small>Pace</small><strong>{{ paceLabel() }}</strong></span>
      <span><small>Consistency</small><strong>{{ consistencyLabel() }}</strong></span>
    </div>
  </section>
</template>
