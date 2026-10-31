<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import SettingsToggleRow from './SettingsToggleRow.vue'
import { readBackupPreferences, updateBackupPreferences } from '../../../data/repositories/automaticBackupRepository.js'
import { checkAutomaticBackup, supportsAutomaticBackups } from '../services/automaticBackupService.js'

const settings = ref({ enabled: false, intervalDays: 7, keepLatestOnly: false })
const supported = supportsAutomaticBackups()
const busy = ref(false)
const error = ref('')

async function refresh() {
  try { settings.value = await readBackupPreferences() }
  catch { error.value = 'Could not read automatic backup settings.' }
}

async function save(changes) {
  try {
    await updateBackupPreferences(changes)
    await refresh()
  } catch { error.value = 'Could not save automatic backup settings.' }
}

async function chooseFolder() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    // Must be the first awaited call: the picker requires a user gesture.
    const directory = await window.showDirectoryPicker({ mode: 'readwrite', id: 'fitnotes-backups' })
    const same = settings.value.directory && await directory.isSameEntry(settings.value.directory)
    await updateBackupPreferences({
      directory, enabled: true, error: '',
      ...(same ? {} : { files: [], lastBackupAt: null }),
    })
    await checkAutomaticBackup()
    await refresh()
  } catch (failure) {
    if (failure.name !== 'AbortError') error.value = failure.message || 'Could not access this folder.'
  } finally { busy.value = false }
}

async function toggleEnabled() {
  if (busy.value) return
  if (!settings.value.enabled) return chooseFolder()
  await save({ enabled: false })
}

async function changeInterval(event) {
  await save({ intervalDays: Number(event.target.value) })
  await checkAutomaticBackup()
}

onMounted(() => {
  void refresh()
  window.addEventListener('automatic-backup-updated', refresh)
})
onBeforeUnmount(() => window.removeEventListener('automatic-backup-updated', refresh))
</script>

<template>
  <section class="automatic-backup-settings" aria-label="Automatic backups" :aria-busy="busy">
    <SettingsToggleRow
      v-if="supported"
      label="Automatic backups"
      description="Save a backup when you open the app and the selected interval has passed."
      :enabled="settings.enabled"
      @toggle="toggleEnabled"
    />
    <div v-else class="automatic-backup-unavailable">
      <strong>Automatic backups</strong>
      <p>This browser cannot save automatically to a chosen folder. Use manual export, or a compatible browser over HTTPS.</p>
    </div>

    <template v-if="supported && settings.enabled">
      <div class="settings-data-action">
        <div>
          <strong>Backup folder</strong>
          <p class="backup-folder">{{ settings.directory?.name || 'No folder selected' }}</p>
          <p>Your browser shares the folder name, not its full path.</p>
        </div>
        <button class="settings-export-button" type="button" :disabled="busy" @click="chooseFolder">Change folder</button>
      </div>

      <label class="backup-interval">
        <strong>Back up every {{ settings.intervalDays }} {{ settings.intervalDays === 1 ? 'day' : 'days' }}</strong>
        <input type="range" min="1" max="30" step="1" :value="settings.intervalDays" aria-label="Backup interval in days" @input="settings.intervalDays = Number($event.target.value)" @change="changeInterval" />
        <span class="backup-interval-limits"><span>1 day</span><span>30 days</span></span>
      </label>

      <SettingsToggleRow
        label="Keep only the latest backup"
        description="After saving a new backup, remove older automatic backups created in this folder."
        :enabled="settings.keepLatestOnly"
        @toggle="save({ keepLatestOnly: !settings.keepLatestOnly })"
      />
      <p class="backup-status" role="status">
        {{ busy ? 'Preparing backup…' : settings.lastBackupAt ? `Last backup: ${new Date(settings.lastBackupAt).toLocaleString()}` : 'No automatic backup saved yet.' }}
      </p>
      <p class="backup-status">Complete .fitnotes backup when available; otherwise a CSV export of training and body data. Folder permission may need to be renewed.</p>
    </template>
    <p v-if="error || settings.error" class="error-message" role="alert">{{ error || settings.error }}</p>
  </section>
</template>

<style scoped>
.automatic-backup-settings { min-width: 0; }
.automatic-backup-unavailable, .backup-interval { display: block; padding: 18px 0; border-bottom: 1px solid var(--theme-border, #242424); }
.automatic-backup-unavailable p, .backup-status { color: var(--theme-text-muted, #777780); font-size: 13px; line-height: 1.5; }
.backup-interval strong, .automatic-backup-unavailable strong { font-size: 15px; }
.backup-interval input { display: block; width: 100%; min-height: 44px; margin-top: 8px; accent-color: var(--accent-colour, #3f96ff); }
.backup-interval-limits { display: flex; justify-content: space-between; color: var(--theme-text-muted, #777780); font-size: 12px; }
.backup-folder { overflow-wrap: anywhere; }
</style>
