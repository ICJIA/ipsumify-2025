<template>
  <v-tooltip location="bottom" text="Reset all options">
    <template #activator="{ props: tooltipProps }">
      <button
        v-bind="tooltipProps"
        class="reset-btn"
        :class="{ 'reset-btn-light': !isDark }"
        :aria-label="$attrs['aria-label'] || 'Reset options'"
        @click="$emit('reset')"
      >
        <v-icon
          size="20"
          class="reset-icon"
          :color="isDark ? 'on-surface' : 'on-surface'"
          aria-hidden="true"
        >
          mdi-refresh
        </v-icon>
      </button>
    </template>
  </v-tooltip>
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

<style scoped>
.reset-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.reset-btn:hover .reset-icon {
  transform: rotate(-180deg);
}

.reset-btn:active {
  transform: scale(0.95);
}

.reset-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.reset-btn-light {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
}

.reset-btn-light:hover {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.12);
}

.reset-icon {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
