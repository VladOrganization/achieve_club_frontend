<template>
  <div class="flex items-center justify-around h-24 px-2">
    <!-- Вкладка 1: Главная -->
    <router-link
        to="/dashboard"
        class="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg w-20 transition-all duration-200"
        :class="isActive('/dashboard') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'"
    >
      <div class="relative">
        <i class="pi pi-home text-2xl"></i>
        <div
            v-if="isActive('/dashboard')"
            class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"
        ></div>
      </div>
      <span class="text-xs font-medium text-center">Главная</span>
    </router-link>

    <!-- Вкладка 2: Студенты -->
    <router-link
        to="/students"
        class="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg w-20 transition-all duration-200"
        :class="isActive('/students') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'"
    >
      <div class="relative">
        <i class="pi pi-users text-2xl"></i>
        <div
            v-if="isActive('/students')"
            class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"
        ></div>
      </div>
      <span class="text-xs font-medium text-center">Студенты</span>
    </router-link>

    <!-- Вкладка 3: Достижения -->
    <router-link
        to="/achievements"
        class="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg w-20 transition-all duration-200"
        :class="isActive('/achievements') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'"
    >
      <div class="relative">
        <i class="pi pi-star text-2xl"></i>
        <div
            v-if="isActive('/achievements')"
            class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"
        ></div>
      </div>
      <span class="text-xs font-medium text-center">Достижения</span>
    </router-link>

    <!-- Вкладка 4: Аналитика -->
    <router-link
        to="/analytics"
        class="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg w-20 transition-all duration-200"
        :class="isActive('/analytics') ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'"
    >
      <div class="relative">
        <i class="pi pi-chart-bar text-2xl"></i>
        <div
            v-if="isActive('/analytics')"
            class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"
        ></div>
      </div>
      <span class="text-xs font-medium text-center">Аналитика</span>
    </router-link>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isActive = (path) => {
  return route.path.startsWith(path)
}
</script>

<style scoped>
a {
  text-decoration: none;
}

a.router-link-active {
  /* Активный стиль уже применяется через :class */
}
</style>