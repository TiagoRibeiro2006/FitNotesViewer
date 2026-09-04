<script setup>
import { ref, watch } from 'vue'
import { useDragList } from '../../../shared/composables/useDragList'
import { formatNumber } from '../../../shared/utils/numbers'
import { formatBodyEntryDate, formatBodyValue } from '../bodyFormatters'

const props = defineProps({
  sections: { type: Array, required: true },
  favoritesSaving: { type: Boolean, default: false },
  managing: { type: Boolean, default: false },
  managementSaving: { type: Boolean, default: false },
})

const emit = defineEmits([
  'delete-measurement',
  'edit-measurement',
  'move-favorite',
  'open-measurement',
  'save-favorite-order',
  'toggle-favorite',
])
const activeMenuKey = ref('')
const deleteConfirmingKey = ref('')
const editingKey = ref('')
const editingName = ref('')
let skipNextMenuClick = false
const { draggingIndex, startDrag } = useDragList(moveFavorite, saveFavoriteOrder)

watch(readManaging, resetManagementState)

function readManaging() {
  return props.managing
}

function closeMenu() {
  activeMenuKey.value = ''
  deleteConfirmingKey.value = ''
}

function resetManagementState() {
  closeMenu()
  editingKey.value = ''
  editingName.value = ''
}

function menuKey(sectionId, itemId) {
  return String(sectionId) + ':' + String(itemId)
}

function toggleMenu(sectionId, itemId) {
  if (skipNextMenuClick) {
    skipNextMenuClick = false
    return
  }

  const key = menuKey(sectionId, itemId)
  activeMenuKey.value = activeMenuKey.value === key ? '' : key
  deleteConfirmingKey.value = ''
}

function startFavoriteDrag(event, section, index) {
  const disabled = section.id !== 'favorites'
    || !props.managing
    || props.favoritesSaving
    || props.managementSaving
  if (!disabled) closeMenu()
  startDrag(event, index, disabled)
}

function moveFavorite(fromIndex, toIndex) {
  emit('move-favorite', fromIndex, toIndex)
}

function saveFavoriteOrder() {
  skipNextMenuClick = true
  window.setTimeout(clearSkippedMenuClick, 0)
  emit('save-favorite-order')
}

function clearSkippedMenuClick() {
  skipNextMenuClick = false
}

function openMeasurement(item) {
  emit('open-measurement', item)
}

function chooseAction(action, item, sectionId) {
  if (action === 'edit-measurement') {
    closeMenu()
    editingKey.value = menuKey(sectionId, item.id)
    editingName.value = item.name
    return
  }

  if (action === 'delete-measurement') {
    if (deleteConfirmingKey.value !== String(item.id)) {
      deleteConfirmingKey.value = String(item.id)
      return
    }
  }
  closeMenu()
  emit(action, item)
}

function cancelEditing() {
  editingKey.value = ''
  editingName.value = ''
}

function saveName(item) {
  const name = editingName.value.trim()
  if (!name || props.managementSaving) return
  emit('edit-measurement', { item, name })
  cancelEditing()
}
</script>

<template>
  <div class="body-sections">
    <section
      v-for="section in sections"
      :key="section.id"
      class="body-section-card"
      :class="{ 'is-reordering': section.id === 'favorites' && draggingIndex >= 0 }"
    >
      <p class="body-section-label">{{ section.label }}</p>
      <p v-if="!section.items.length" class="body-status">{{ section.emptyMessage }}</p>

      <div
        v-else
        class="body-measurement-list"
        :class="{ 'is-reordering': section.id === 'favorites' && draggingIndex >= 0 }"
        :data-drag-list="section.id === 'favorites' && managing ? '' : null"
      >
        <article
          v-for="(item, index) in section.items"
          :key="item.id"
          class="body-measurement-row"
          :class="{
            'is-managing': managing,
            'is-dragging': section.id === 'favorites' && draggingIndex === index,
          }"
          :data-drag-item="section.id === 'favorites' && managing ? '' : null"
        >
          <button
            v-if="managing"
            class="body-item-menu-toggle"
            :class="{ 'is-favorite-drag-handle': section.id === 'favorites' }"
            type="button"
            :aria-expanded="activeMenuKey === menuKey(section.id, item.id)"
            :aria-label="'Manage ' + item.name"
            @contextmenu.prevent
            @pointerdown="startFavoriteDrag($event, section, index)"
            @click="toggleMenu(section.id, item.id)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>

          <form
            v-if="editingKey === menuKey(section.id, item.id)"
            class="body-measurement-copy body-name-edit-form"
            @submit.prevent="saveName(item)"
          >
            <span class="body-name-edit-control">
              <input
                v-model="editingName"
                type="text"
                maxlength="100"
                autocomplete="off"
                spellcheck="false"
                :aria-label="'Edit ' + item.name"
                @keydown.esc.prevent="cancelEditing"
              />
              <button type="submit" :disabled="managementSaving || !editingName.trim()" aria-label="Save measurement name">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </button>
            </span>
            <span class="body-measurement-value">
              <strong>{{ formatBodyValue(item) }}</strong>
              <span v-if="item.change !== null" class="body-measurement-change">
                {{ item.change < 0 ? '▼' : '▲' }} {{ formatNumber(Math.abs(item.change)) }}
              </span>
            </span>
            <small v-if="item.date">{{ formatBodyEntryDate(item) }}</small>
          </form>

          <button v-else class="body-measurement-copy" type="button" :aria-label="'Open ' + item.name" @click="openMeasurement(item)">
            <span class="body-measurement-name">{{ item.name }}</span>
            <span class="body-measurement-value">
              <strong>{{ formatBodyValue(item) }}</strong>
              <span v-if="item.change !== null" class="body-measurement-change">
                {{ item.change < 0 ? '▼' : '▲' }} {{ formatNumber(Math.abs(item.change)) }}
              </span>
            </span>
            <small v-if="item.date">{{ formatBodyEntryDate(item) }}</small>
          </button>

          <button
            class="body-favorite-button"
            type="button"
            :aria-label="item.favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`"
            :aria-pressed="item.favorite"
            :disabled="favoritesSaving"
            @click="emit('toggle-favorite', item)"
          >
            <svg class="body-measurement-heart" :class="{ 'is-favorite': item.favorite }" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
            </svg>
          </button>

          <div
            v-if="managing && activeMenuKey === menuKey(section.id, item.id)"
            class="body-item-action-menu"
            role="menu"
          >
            <button type="button" role="menuitem" :disabled="managementSaving" @click="chooseAction('edit-measurement', item, section.id)">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m4 16.5-.7 4.2 4.2-.7L18.8 8.7l-3.5-3.5L4 16.5Z" />
                <path d="m13.8 6.7 3.5 3.5" />
              </svg>
              <span>Edit</span>
            </button>
            <button
              class="is-danger"
              type="button"
              role="menuitem"
              :disabled="managementSaving"
              @click="chooseAction('delete-measurement', item)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m7 7 10 10M17 7 7 17" />
              </svg>
              <span>{{ deleteConfirmingKey === String(item.id) ? 'Tap again to delete' : 'Delete' }}</span>
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
