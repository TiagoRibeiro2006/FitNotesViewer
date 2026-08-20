<script setup>
import { computed, onMounted, ref } from 'vue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5080'
const storageKey = 'fitnotes-viewer-data-v2'

const selectedFile = ref(null)
const data = ref(null)
const error = ref('')
const loading = ref(false)
const selectedDate = ref(todayKey())

const fileLabel = computed(() => selectedFile.value?.name || 'No file selected')

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

  if (selectedDate.value === today) return 'Today'
  if (selectedDate.value === yesterday) return 'Yesterday'
  if (selectedDate.value === tomorrow) return 'Tomorrow'

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
  return new Intl.DateTimeFormat('en-GB', {
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
    error.value = 'Select a .fitnotes file first.'
    return
  }

  if (!selectedFile.value.name.toLowerCase().endsWith('.fitnotes')) {
    error.value = 'The file must use the .fitnotes extension.'
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
      throw new Error(body?.message || 'The file could not be analysed.')
    }

    data.value = body
    selectedDate.value = todayKey()
    localStorage.setItem(storageKey, JSON.stringify(body))
  } catch (err) {
    error.value = err.message || 'Unexpected error while contacting the API.'
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
        <h1>Your workouts</h1>
      </div>
      <span v-if="data" class="data-pill">{{ data.totalSets }} sets</span>
    </header>

    <section class="upload-card">
      <label class="file-picker">
        <input type="file" accept=".fitnotes" @change="onFileChange" />
        <span>Choose .fitnotes</span>
      </label>

      <p class="file-name">{{ fileLabel }}</p>

      <button class="primary-button" :disabled="loading || !selectedFile" @click="analyzeFile">
        {{ loading ? 'Importing…' : data ? 'Update data' : 'Import' }}
      </button>

      <p v-if="error" class="error-message">{{ error }}</p>
    </section>

    <section v-if="data" class="day-card">
      <div class="day-navigation">
        <button class="nav-button" aria-label="Previous day" @click="changeDay(-1)">←</button>

        <div class="day-title">
          <h2>{{ selectedDateLabel }}</h2>
          <p>{{ selectedDateLong }}</p>
        </div>

        <button class="nav-button" aria-label="Next day" @click="changeDay(1)">→</button>
      </div>

      <div v-if="dayExercises.length" class="exercise-list">
        <article v-for="exercise in dayExercises" :key="exercise.id" class="exercise-row">
          <strong>{{ exercise.name }}</strong>
          <span>{{ exercise.sets }} {{ exercise.sets === 1 ? 'set' : 'sets' }}</span>
        </article>
      </div>

      <div v-else class="empty-day">
        <p>No workout on this day.</p>
      </div>
    </section>

    <section v-else class="empty-state">
      <p>Import your FitNotes backup to see the exercises for each day.</p>
    </section>
  </main>

  <nav class="bottom-bar" aria-label="App navigation">
    <button class="bottom-item" type="button" aria-label="Body">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="5" r="2.25" />
        <path d="M8.5 10.2c.9-1.7 2-2.7 3.5-2.7s2.6 1 3.5 2.7M9 10.5l-1 4.5m7-4.5 1 4.5M10.4 13.5 10 21m3.6-7.5.4 7.5" />
      </svg>
      <span>Body</span>
    </button>

    <button class="bottom-item" type="button" aria-label="Calendar">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
        <path d="M7.5 3.5v4m9-4v4M3.5 10h17" />
      </svg>
      <span>Calendar</span>
    </button>

    <button class="bottom-item is-active" type="button" aria-label="Start">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 2.65 5.37 5.93.86-4.29 4.18 1.01 5.91L12 16.53 6.7 19.32l1.01-5.91-4.29-4.18 5.93-.86L12 3Z" />
      </svg>
      <span>Start</span>
    </button>

    <button class="bottom-item" type="button" aria-label="Charts">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V10m5 10V4m6 16v-7m5 7V7" />
      </svg>
      <span>Charts</span>
    </button>

    <button class="bottom-item" type="button" aria-label="Settings">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9c.16.38.5.72.91.88.2.08.41.12.63.12H21v4h-.09c-.66 0-1.26.4-1.51 1Z" />
      </svg>
      <span>Settings</span>
    </button>
  </nav>
</template>
