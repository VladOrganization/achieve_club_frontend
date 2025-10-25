<template>
  <div class="flex flex-col min-h-screen">
    <!-- Основное содержимое с отступом снизу -->
    <main class="flex-1 pb-15 overflow-y-auto">
      <RouterView />
    </main>

    <!-- Нижняя навигация -->
    <BottomNavigation />
  </div>
</template>

<script setup>
import BottomNavigation from '@/components/BottomNavigation.vue'
</script>