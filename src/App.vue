<template>
  <div class="relative isolate flex flex-col min-h-screen bg-white">
    <!-- Фон страницы: почти белый, с неравномерно перетекающими оранжевыми пятнами из логотипа ByteSchool -->
    <BlendBackground class="fixed inset-0 -z-20 pointer-events-none"/>

    <!-- Сетка логотипов, едва заметная, медленно едет вниз -->
    <ScrollingLogoGrid class="fixed inset-0 -z-10 pointer-events-none opacity-[0.045]"/>

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
import BlendBackground from '@/components/BlendBackground.vue'
import BottomNavigation from '@/components/BottomNavigation.vue'
import ScrollingLogoGrid from '@/components/ScrollingLogoGrid.vue'
import {RouterView, useRoute} from 'vue-router'

const route = useRoute()

</script>
