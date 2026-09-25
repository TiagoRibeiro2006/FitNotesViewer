<script setup>
import { nextTick, onMounted, ref } from 'vue'
import AppSectionHeader from '../../shared/components/AppSectionHeader.vue'
import BodyMeasurementCreateView from './components/BodyMeasurementCreateView.vue'
import BodyMeasurementDetailView from './components/BodyMeasurementDetailView.vue'
import BodyMeasurementList from './components/BodyMeasurementList.vue'
import { useBodyTracker } from './composables/useBodyTracker'

const props = defineProps({
  startManaging: { type: Boolean, default: false },
})

const {
  addMeasurement,
  error,
  favoritesSaving,
  loading,
  managementSaving,
  moveFavorite,
  removeMeasurement,
  renameMeasurement,
  saveFavoriteOrder,
  sections,
  load,
  toggleFavorite,
} = useBodyTracker()

const selectedItem = ref(null)
const managing = ref(props.startManaging)
const creatingMeasurement = ref(false)

onMounted(async () => {
  await load()
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
})

const INTERACTIVE_SELECTOR = `
  button,
  a,
  input,
  textarea,
  select,
  label,
  form,
  [role="button"],
  [role="menu"],
  [role="menuitem"],
  [data-body-interactive]
`

function isInteractiveClick(event) {
  return event.composedPath().some((element) => {
    return (
      element instanceof Element &&
      element.matches(INTERACTIVE_SELECTOR)
    )
  })
}

function handlePageClick(event) {
  if (!managing.value) return

  if (isInteractiveClick(event)) {
    return
  }

  managing.value = false
}

async function openMeasurement(item) {
  selectedItem.value = item

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

async function closeMeasurement() {
  selectedItem.value = null

  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
}

async function handleHeaderAction() {
  if (!managing.value) {
    managing.value = true
    return
  }

  creatingMeasurement.value = true
  await scrollToTop()
}

async function closeCreateMeasurement() {
  creatingMeasurement.value = false
  await scrollToTop()
}

async function saveNewMeasurement(details) {
  if (await addMeasurement(details)) {
    await closeCreateMeasurement()
  }
}

async function scrollToTop() {
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
}
</script>

<template>
  <BodyMeasurementCreateView
    v-if="creatingMeasurement"
    :error="error"
    :saving="managementSaving"
    @close="closeCreateMeasurement"
    @save="saveNewMeasurement"
  />

  <BodyMeasurementDetailView
    v-else-if="selectedItem"
    :item="selectedItem"
    @close="closeMeasurement"
    @changed="load"
  />

  <template v-else>
    <div
      class="body-tracker-page"
      @click="handlePageClick"
    >
      <AppSectionHeader title="Body Tracker">
        <template #action>
          <button
            class="body-manage-toggle"
            :class="{ 'is-active': managing }"
            type="button"
            :aria-pressed="managing"
            :aria-label="
              managing
                ? 'Add body measurement'
                : 'Manage body measurements'
            "
            @click="handleHeaderAction"
          >
            <svg
              v-if="managing"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>

            <svg
              v-else
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="m4 16.5-.7 4.2 4.2-.7L18.8 8.7l-3.5-3.5L4 16.5Z"
              />
              <path d="m13.8 6.7 3.5 3.5" />
            </svg>
          </button>
        </template>
      </AppSectionHeader>

      <div
        v-if="loading"
        class="body-status"
      >
        Loading body data…
      </div>

      <p
        v-else-if="error"
        class="body-error"
      >
        {{ error }}
      </p>

      <BodyMeasurementList
        v-else
        :sections="sections"
        :managing="managing"
        :management-saving="managementSaving"
        :favorites-saving="favoritesSaving"
        @delete-measurement="removeMeasurement"
        @edit-measurement="renameMeasurement"
        @move-favorite="moveFavorite"
        @open-measurement="openMeasurement"
        @save-favorite-order="saveFavoriteOrder"
        @toggle-favorite="toggleFavorite"
      />
    </div>
  </template>
</template>
