<template>
  <nav class="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-lg">
    <div class="flex justify-around items-center h-16">
      <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="item.path"
          class="flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs font-medium transition-colors"
          :class="[
          isActive(item.path)
            ? 'text-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        ]"
      >
        <i :class="[item.icon, 'text-xl']"></i>
        <span>{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import {useRoute} from 'vue-router'
import {useAuthStore} from "@/stores/auth.js";
import {onMounted, ref} from "vue";

const route = useRoute()
const authStore = useAuthStore()

const navItems = ref([
  {name: 'home', path: '/', label: 'Главная', icon: 'pi pi-home'},
  {name: 'students', path: '/search', label: 'Топ', icon: 'pi pi-users'}
])

onMounted(() => {
  const role = authStore.userRole

  if (role === 2 || role === 3) {
    navItems.value = [
      {name: 'home', path: '/', label: 'Главная', icon: 'pi pi-home'},
      {name: 'students', path: '/search', label: 'Топ', icon: 'pi pi-users'},
      ...navItems.value
    ]
  }
})

const isActive = (path) => route.path === path
</script>