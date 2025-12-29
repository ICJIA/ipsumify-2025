<template>
  <v-snackbar
    :model-value="show"
    :timeout="3000"
    location="top"
    :color="isDark ? 'grey-darken-3' : 'white'"
    elevation="24"
  >
    <div class="d-flex align-center">
      <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
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

