<template>
  <button
      type="button"
      class="theme-switch"
      :class="{ 'is-dark': theme.isDark }"
      :aria-pressed="theme.isDark"
      aria-label="Переключить тему"
      @click="theme.toggle($event)"
  >
    <span class="theme-switch__track">
      <i class="pi pi-sun theme-switch__icon theme-switch__icon--sun"></i>
      <i class="pi pi-moon theme-switch__icon theme-switch__icon--moon"></i>
      <span class="theme-switch__thumb"></span>
    </span>
  </button>
</template>

<script setup>
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme.js'

const theme = useThemeStore()

onMounted(() => {
  theme.apply(theme.isDark)
})
</script>

<style scoped>
.theme-switch {
  position: relative;
  z-index: 60;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.theme-switch__track {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 4.25rem;
  height: 2.25rem;
  padding: 0 0.45rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #fde4d0, #fbc7a3);
  box-shadow: inset 0 0 0 1px rgba(245, 110, 15, 0.25);
  overflow: hidden;
  transition: background 0.45s ease, box-shadow 0.45s ease;
}

.theme-switch.is-dark .theme-switch__track {
  background: linear-gradient(135deg, #1f1b48, #3b3386);
  box-shadow: inset 0 0 0 1px rgba(238, 195, 90, 0.35);
}

.theme-switch__icon {
  position: relative;
  z-index: 1;
  font-size: 0.85rem;
  transition: transform 0.45s ease, opacity 0.45s ease, color 0.45s ease;
}

.theme-switch__icon--sun {
  color: #f56e0f;
}

.theme-switch__icon--moon {
  color: #eec35a;
  opacity: 0.45;
  transform: scale(0.85) rotate(-25deg);
}

.theme-switch.is-dark .theme-switch__icon--sun {
  opacity: 0.4;
  transform: scale(0.85) rotate(40deg);
}

.theme-switch.is-dark .theme-switch__icon--moon {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.theme-switch__thumb {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  background: #fbfbfb;
  box-shadow: 0 4px 12px rgba(31, 27, 72, 0.22);
  transition: transform 0.45s cubic-bezier(0.22, 1.2, 0.36, 1), background 0.45s ease;
  will-change: transform;
}

.theme-switch.is-dark .theme-switch__thumb {
  transform: translateX(2rem);
  background: #eec35a;
  box-shadow: 0 4px 14px rgba(238, 195, 90, 0.45);
}

@media (prefers-reduced-motion: reduce) {
  .theme-switch__track,
  .theme-switch__icon,
  .theme-switch__thumb {
    transition: none;
  }
}
</style>
