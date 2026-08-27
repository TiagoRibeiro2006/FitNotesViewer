<script setup>
import { computed, onMounted, ref } from 'vue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5080'
const storageKey = 'fitnotes-viewer-data-v2'

const selectedFile = ref(null)
const data = ref(null)
const error = ref('')
const loading = ref(false)
const selectedDate = ref(todayKey())

const fileLabel = computed(() => selectedFile.value?.name || 'Nenhum ficheiro selecionado')

const dayExercises = computed(() => {
  const sets = data.value?.workoutSets?.filter((set) => set.date === selectedDate.value) ?? []
  const exercises = new Map()

  for (const set of sets) {
    if (!exercises.has(set.exerciseId)) {
      exercises.set(set.exerciseId, {
        id: set.exerciseId,
        name: set.exerciseName,
        sets: 0,
      })
    }

    exercises.get(set.exerciseId).sets += 1
  }

  return [...exercises.values()]
})

const selectedDateLabel = computed(() => {
  const today = todayKey()
  const yesterday = shiftDateKey(today, -1)
  const tomorrow = shiftDateKey(today, 1)

  if (selectedDate.value === today) return 'Hoje'
  if (selectedDate.value === yesterday) return 'Ontem'
  if (selectedDate.value === tomorrow) return 'Amanhã'

  return formatDate(selectedDate.value)
})

const selectedDateLong = computed(() => formatDate(selectedDate.value))

onMounted(() => {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) data.value = JSON.parse(saved)
  } catch {
    localStorage.removeItem(storageKey)
  }
})

function todayKey() {
  const now = new Date()
  return dateToKey(now)
}

function dateToKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDateKey(dateKey, amount) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + amount)
  return dateToKey(date)
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function changeDay(amount) {
  selectedDate.value = shiftDateKey(selectedDate.value, amount)
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] ?? null
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

    data.value = body
    selectedDate.value = todayKey()
    localStorage.setItem(storageKey, JSON.stringify(body))
  } catch (err) {
    error.value = err.message || 'Erro inesperado ao comunicar com a API.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">FITNOTES VIEWER</p>
        <h1>Os teus treinos</h1>
      </div>
      <span v-if="data" class="data-pill">{{ data.totalSets }} séries</span>
    </header>

    <section class="upload-card">
      <label class="file-picker">
        <input type="file" accept=".fitnotes" @change="onFileChange" />
        <span>Escolher .fitnotes</span>
      </label>

      <p class="file-name">{{ fileLabel }}</p>

      <button class="primary-button" :disabled="loading || !selectedFile" @click="analyzeFile">
        {{ loading ? 'A importar…' : data ? 'Atualizar dados' : 'Importar' }}
      </button>

      <p v-if="error" class="error-message">{{ error }}</p>
    </section>

    <section v-if="data" class="day-card">
      <div class="day-navigation">
        <button class="nav-button" aria-label="Dia anterior" @click="changeDay(-1)">←</button>

        <div class="day-title">
          <h2>{{ selectedDateLabel }}</h2>
          <p>{{ selectedDateLong }}</p>
        </div>

        <button class="nav-button" aria-label="Dia seguinte" @click="changeDay(1)">→</button>
      </div>

      <div v-if="dayExercises.length" class="exercise-list">
        <article v-for="exercise in dayExercises" :key="exercise.id" class="exercise-row">
          <strong>{{ exercise.name }}</strong>
          <span>{{ exercise.sets }} {{ exercise.sets === 1 ? 'série' : 'séries' }}</span>
        </article>
      </div>

      <div v-else class="empty-day">
        <p>Sem treino neste dia.</p>
      </div>
    </section>

    <section v-else class="empty-state">
      <p>Importa o teu backup FitNotes para veres os exercícios de cada dia.</p>
    </section>
  </main>
</template>
