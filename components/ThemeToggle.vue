<template>
  <div class="d-flex flex-column align-center mb-4">
    <v-switch
      :model-value="!isDark"
      @update:model-value="$emit('toggle')"
      color="primary"
      hide-details
      density="compact"
    >
      <template #label>
        <span class="text-caption mt-1" :class="isDark ? 'text-grey-lighten-1' : 'text-grey-darken-1'">
          {{ isDark ? 'Dark mode' : 'Light mode' }}
        </span>
      </template>
    </v-switch>
  </div>
</template>

<script setup>
defineProps({
  isDark: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['toggle'])
</script>

