<template>
  <div class="flex flex-col min-h-screen">
    <template v-if="route.name === '/login' || route.name === '/register'">
      <RouterView/>
    </template>
    <template v-else>
      <!-- Основное содержимое с отступом снизу -->
      <main class="flex-1 pb-15 overflow-y-auto">
        <RouterView/>
      </main>

      <!-- Нижняя навигация -->
      <BottomNavigation/>
    </template>
  </div>
</template>

<script setup>
import BottomNavigation from '@/components/BottomNavigation.vue'
import {RouterView, useRoute} from 'vue-router'

const route = useRoute()
</script>