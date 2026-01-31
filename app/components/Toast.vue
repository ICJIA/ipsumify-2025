<template>
  <v-snackbar
    :model-value="show"
    :timeout="3000"
    location="top"
    color="success"
    elevation="8"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="modern-toast"
  >
    <div class="d-flex align-center">
      <v-icon class="mr-3" aria-hidden="true">mdi-check-circle</v-icon>
      <span class="font-weight-medium">{{ message }}</span>
    </div>
  </v-snackbar>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
    required: true,
  },
  isDark: {
    type: Boolean,
    required: true,
  },
})
</script>

<style>
.modern-toast .v-snackbar__wrapper {
  border-radius: 12px !important;
}
</style>
