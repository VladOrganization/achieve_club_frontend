<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-md z-40 sticky top-0">
      <div class="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto w-full">
        <!-- Логотип -->
        <router-link to="/" class="flex items-center gap-2 font-bold text-xl text-indigo-600 hover:text-indigo-700 transition-colors">
          <i class="pi pi-graduation-cap text-2xl"></i>
          <span class="hidden sm:inline">ByteSchool</span>
        </router-link>

        <!-- Поиск -->
        <div class="hidden md:flex flex-1 max-w-md mx-8">
          <InputGroup>
            <InputGroupAddon>
              <i class="pi pi-search text-gray-400"></i>
            </InputGroupAddon>
            <InputText
                placeholder="Поиск студентов..."
                class="w-full"
                :pt="{
                root: { class: 'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500' }
              }"
            />
          </InputGroup>
        </div>

        <!-- Пусто для баланса -->
        <div class="w-12"></div>
      </div>
    </header>

    <!-- Основной контент -->
    <main class="flex-1 overflow-auto pb-20 md:pb-0">
      <div class="max-w-7xl mx-auto w-full">
        <RouterView />
      </div>
    </main>

    <!-- Нижняя навигация (мобильная версия) -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <BottomNav />
    </nav>

    <!-- Десктопная навигация -->
    <nav class="hidden md:block bg-white border-t border-gray-200 px-6 py-4">
      <div class="max-w-7xl mx-auto">
        <p class="text-xs text-gray-500">© 2024 ByteSchool. Все права защищены.</p>
      </div>
    </nav>

    <!-- Toast для уведомлений -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Toast from 'primevue/toast'
import BottomNav from '@/components/BottomNav.vue'
</script>

<style scoped>
/* Стили для layout */
</style>