<template>
  <button
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    class="theme-toggle"
    :class="{ 'theme-toggle-light': !isDark }"
    @click="$emit('toggle')"
  >
    <span class="theme-toggle-track">
      <span class="theme-toggle-thumb" :class="{ 'thumb-light': !isDark }">
        <v-icon
          :size="18"
          :color="isDark ? 'warning' : 'primary'"
          class="theme-icon"
          aria-hidden="true"
        >
          {{ isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}
        </v-icon>
      </span>
    </span>
  </button>
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

<style scoped>
.theme-toggle {
  position: relative;
  width: 64px;
  height: 36px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  outline: none;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.theme-toggle:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.theme-toggle-light {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.1);
}

.theme-toggle-light:hover {
  background: rgba(0, 0, 0, 0.08);
}

.theme-toggle-track {
  position: absolute;
  inset: 3px;
  border-radius: 9999px;
}

.theme-toggle-thumb {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #1E293B, #334155);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.thumb-light {
  left: calc(100% - 28px);
  background: linear-gradient(135deg, #FFFFFF, #F1F5F9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.theme-icon {
  transition: transform 0.3s ease;
}

.theme-toggle:hover .theme-icon {
  transform: rotate(15deg);
}
</style>
