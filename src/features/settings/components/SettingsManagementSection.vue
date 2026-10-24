<script setup>
const emit = defineEmits(['manage-muscles', 'manage-exercises'])

function manageMuscles() {
  emit('manage-muscles')
}

function manageExercises() {
  emit('manage-exercises')
}

</script>

<template>
  <section class="settings-card">
    <div class="settings-section-heading">
      <div>
        <p class="eyebrow">EDIT</p>
        <h2>Muscles & exercises</h2>
      </div>
    </div>

    <div class="settings-data-action settings-data-action-first">
      <div>
        <strong>Manage muscles</strong>
        <p>Rename muscles and change their colours.</p>
      </div>
      <button class="settings-export-button" type="button" @click="manageMuscles">
        Open muscles
      </button>
    </div>

    <div class="settings-data-action">
      <div>
        <strong>Manage exercises</strong>
        <p>Rename exercises and change their muscle.</p>
      </div>
      <button class="settings-export-button" type="button" @click="manageExercises">
        Open exercises
      </button>
    </div>

  </section>
</template>
