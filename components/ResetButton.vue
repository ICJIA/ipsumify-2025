<template>
  <div class="d-flex flex-column align-center mb-4">
    <v-btn
      @click="$emit('reset')"
      icon
      variant="text"
      size="small"
      :color="isDark ? 'grey-lighten-1' : 'grey-darken-1'"
      :aria-label="$attrs['aria-label'] || 'Reset options'"
    >
      <v-icon aria-hidden="true">mdi-refresh</v-icon>
    </v-btn>
    <span
      class="text-caption mt-1"
      :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-1'"
    >
      Reset
    </span>
  </div>
</template>

<script setup>
defineProps({
  isDark: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['reset'])
</script>

