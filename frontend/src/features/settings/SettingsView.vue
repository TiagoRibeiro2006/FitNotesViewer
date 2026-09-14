<script setup>
import { onMounted, ref } from 'vue'
import AppSectionHeader from '../../shared/components/AppSectionHeader.vue'
import TrainingChatLogsModal from '../ai-chat/components/TrainingChatLogsModal.vue'
import {
  createTrainingChat,
  selectTrainingChat,
  useTrainingChatSessionStore,
} from '../ai-chat/services/trainingChatSessionStore.js'
import CatalogManagementModal from '../catalog/CatalogManagementModal.vue'
import SettingsAiLogsSection from './components/SettingsAiLogsSection.vue'
import SettingsDataSection from './components/SettingsDataSection.vue'
import SettingsManagementSection from './components/SettingsManagementSection.vue'

defineProps({
  summary: { type: Object, required: true },
})

const emit = defineEmits([
  'data-imported',
  'data-deleted',
  'manage-body-items',
  'open-training-chat',
])
const catalogMode = ref('muscles')
const catalogOpen = ref(false)
const chatLogsOpen = ref(false)
const { activeChatId, chatSummaries } = useTrainingChatSessionStore()

onMounted(scrollToTop)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'auto' })
}

function openCatalog(mode) {
  catalogMode.value = mode
  catalogOpen.value = true
}

function openMuscles() {
  openCatalog('muscles')
}

function openExercises() {
  openCatalog('exercises')
}

function openBodyItems() {
  emit('manage-body-items')
}

function closeCatalog() {
  catalogOpen.value = false
}

function openChatLogs() {
  chatLogsOpen.value = true
}

function closeChatLogs() {
  chatLogsOpen.value = false
}

function createChat() {
  createTrainingChat()
  closeChatLogs()
  emit('open-training-chat')
}

function selectChat(chatId) {
  if (!selectTrainingChat(chatId)) return
  closeChatLogs()
  emit('open-training-chat')
}

function dataImported(summary) {
  emit('data-imported', summary)
}

function dataDeleted() {
  emit('data-deleted')
}
</script>

<template>
  <AppSectionHeader title="Settings" />

  <div class="settings-sections">
    <SettingsManagementSection
      @manage-muscles="openMuscles"
      @manage-exercises="openExercises"
      @manage-body-items="openBodyItems"
    />

    <SettingsAiLogsSection @open-logs="openChatLogs" />

    <SettingsDataSection
      :summary="summary"
      @data-imported="dataImported"
      @data-deleted="dataDeleted"
    />
  </div>

  <CatalogManagementModal
    :open="catalogOpen"
    :mode="catalogMode"
    @close="closeCatalog"
  />

  <TrainingChatLogsModal
    :open="chatLogsOpen"
    :chats="chatSummaries"
    :active-chat-id="activeChatId"
    @close="closeChatLogs"
    @create="createChat"
    @select="selectChat"
  />
</template>
