<template>
  <div class="flex flex-col min-h-screen bg-canvas">
    <template v-if="route.name === '/login' || route.name === '/register'">
      <RouterView/>
    </template>
    <template v-else>
      <main class="flex-1 pb-15 overflow-y-auto">
        <RouterView/>
      </main>
      <BottomNavigation/>
    </template>

    <div
        class="fixed right-4 z-[60]"
        :class="isAuthScreen ? 'bottom-6' : 'bottom-20'"
    >
      <ThemeToggle />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import BottomNavigation from '@/components/BottomNavigation.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { RouterView, useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/theme.js'

const route = useRoute()
const theme = useThemeStore()
const isAuthScreen = computed(() => route.name === '/login' || route.name === '/register')

onMounted(() => {
  theme.apply(theme.isDark)
})
</script>
