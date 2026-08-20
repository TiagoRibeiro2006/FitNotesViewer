<script setup>
import { computed, ref } from 'vue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5080'

const selectedFile = ref(null)
const result = ref(null)
const error = ref('')
const loading = ref(false)

const fileLabel = computed(() => selectedFile.value?.name || 'Nenhum ficheiro selecionado')

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] ?? null
  result.value = null
  error.value = ''
}

async function analyzeFile() {
  if (!selectedFile.value) {
    error.value = 'Seleciona primeiro um ficheiro .fitnotes.'
    return
  }

  if (!selectedFile.value.name.toLowerCase().endsWith('.fitnotes')) {
    error.value = 'O ficheiro tem de terminar em .fitnotes.'
    return
  }

  loading.value = true
  error.value = ''
  result.value = null

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await fetch(`${apiUrl}/api/fitnotes/analyze`, {
      method: 'POST',
      body: formData,
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(body?.message || 'Não foi possível analisar o ficheiro.')
    }

    result.value = body
  } catch (err) {
    error.value = err.message || 'Erro inesperado ao comunicar com a API.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <p class="eyebrow">FITNOTES VIEWER</p>
      <h1>Importa o teu backup FitNotes</h1>
      <p class="subtitle">
        O ficheiro é analisado temporariamente e a aplicação mostra apenas um pequeno resumo dos teus dados.
      </p>
    </section>

    <section class="upload-card">
      <label class="file-picker">
        <input type="file" accept=".fitnotes" @change="onFileChange" />
        <span>Escolher ficheiro</span>
      </label>

      <p class="file-name">{{ fileLabel }}</p>

      <button class="primary-button" :disabled="loading || !selectedFile" @click="analyzeFile">
        {{ loading ? 'A analisar…' : 'Analisar backup' }}
      </button>

      <p v-if="error" class="error-message">{{ error }}</p>
    </section>

    <section v-if="result" class="results">
      <div class="result-header">
        <div>
          <p class="eyebrow">RESUMO</p>
          <h2>{{ result.fileName }}</h2>
        </div>
        <span class="success-pill">SQLite válido</span>
      </div>

      <div class="stats-grid">
        <article class="stat-card">
          <span>Séries registadas</span>
          <strong>{{ result.totalSets }}</strong>
        </article>
        <article class="stat-card">
          <span>Exercícios</span>
          <strong>{{ result.totalExercises }}</strong>
        </article>
        <article class="stat-card">
          <span>Primeiro treino</span>
          <strong>{{ result.firstWorkoutDate || '—' }}</strong>
        </article>
        <article class="stat-card">
          <span>Último treino</span>
          <strong>{{ result.lastWorkoutDate || '—' }}</strong>
        </article>
      </div>

      <div v-if="result.topExercises?.length" class="top-exercises">
        <h3>Exercícios com mais séries</h3>
        <ol>
          <li v-for="exercise in result.topExercises" :key="exercise.name">
            <span>{{ exercise.name }}</span>
            <strong>{{ exercise.sets }} séries</strong>
          </li>
        </ol>
      </div>
    </section>
  </main>
</template>
