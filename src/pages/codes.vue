<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Коды подтверждения Email</h1>
      <p class="text-gray-600">
        Обновляется автоматически каждые 15 секунд
        <span class="ml-2 text-sm" :class="isLoading ? 'text-blue-500' : 'text-green-500'">
          {{ isLoading ? '⟳ Загрузка...' : '✓ Последнее обновление: ' + lastUpdateTime }}
        </span>
      </p>
    </div>

    <div v-if="proofItems.length === 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p class="text-yellow-800">Нет активных кодов подтверждения</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <div
          v-for="item in proofItems"
          :key="item.email"
          class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm text-gray-600 mb-1">Email</p>
            <p class="text-lg font-semibold text-gray-900 break-all">{{ item.email }}</p>
          </div>

          <div class="mx-6 text-center">
            <p class="text-sm text-gray-600 mb-1">Код</p>
            <p
                class="text-3xl font-bold text-blue-600 font-mono cursor-pointer hover:text-blue-700 transition-colors relative group"
                @click="copyToClipboard(item.proofCode)"
            >
              {{ item.proofCode }}
              <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Кликни для копирования
              </span>
            </p>
          </div>

          <div class="text-center" :class="getTimeRemainingClass(item.createdAt)">
            <p class="text-sm text-gray-600 mb-1">Осталось</p>
            <p class="text-lg font-semibold">
              {{ getTimeRemaining(item.createdAt) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ getProgressPercentage(item.createdAt) }}%
            </p>
          </div>
        </div>

        <div class="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
              class="h-full transition-all duration-500"
              :class="getProgressBarColor(item.createdAt)"
              :style="{ width: getProgressPercentage(item.createdAt) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex gap-2">
      <PrimeButton
          label="Обновить сейчас"
          icon="pi pi-refresh"
          @click="refreshProofCodes"
          :loading="isLoading"
      />
      <PrimeButton
          :label="isAutoRefresh ? 'Остановить обновление' : 'Запустить обновление'"
          :icon="isAutoRefresh ? 'pi pi-pause' : 'pi pi-play'"
          severity="secondary"
          @click="toggleAutoRefresh"
      />
    </div>

    <!-- Уведомление о копировании -->
    <Teleport to="body">
      <Transition name="fade">
        <div
            v-if="showCopyNotification"
            class="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          ✓ Код скопирован!
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import PrimeButton from 'primevue/button'
import api from '@/api/client'

const proofItems = ref([])
const isLoading = ref(false)
const lastUpdateTime = ref('')
const isAutoRefresh = ref(true)
const showCopyNotification = ref(false)
const CACHE_DURATION_MINUTES = 5
const REFRESH_INTERVAL_MS = 15000
const TICK_INTERVAL_MS = 1000

let refreshInterval = null
let tickInterval = null
let updateTrigger = ref(0)

const copyToClipboard = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    showCopyNotification.value = true
    setTimeout(() => {
      showCopyNotification.value = false
    }, 2000)
  } catch (error) {
    console.error('Ошибка при копировании:', error)
  }
}

const getTimeRemaining = (createdAt) => {
  updateTrigger.value
  const created = new Date(createdAt)
  const now = new Date()
  const elapsed = Math.floor((now - created) / 1000)
  const remaining = Math.max(0, CACHE_DURATION_MINUTES * 60 - elapsed)

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const getProgressPercentage = (createdAt) => {
  updateTrigger.value
  const created = new Date(createdAt)
  const now = new Date()
  const elapsed = Math.floor((now - created) / 1000)
  const total = CACHE_DURATION_MINUTES * 60
  const percentage = Math.min(100, Math.round((elapsed / total) * 100))

  return percentage
}

const getTimeRemainingClass = (createdAt) => {
  updateTrigger.value
  const percentage = getProgressPercentage(createdAt)

  if (percentage >= 80) return 'text-red-600'
  if (percentage >= 50) return 'text-yellow-600'
  return 'text-green-600'
}

const getProgressBarColor = (createdAt) => {
  updateTrigger.value
  const percentage = getProgressPercentage(createdAt)

  if (percentage >= 80) return 'bg-red-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

const updateLastUpdateTime = () => {
  const now = new Date()
  lastUpdateTime.value = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const refreshProofCodes = async () => {
  try {
    isLoading.value = true
    const response = await api.get('/api/email/proof-codes')
    proofItems.value = response.data || []
    updateLastUpdateTime()
  } catch (error) {
    console.error('Ошибка при загрузке кодов:', error)
  } finally {
    isLoading.value = false
  }
}

const startTick = () => {
  if (tickInterval) clearInterval(tickInterval)
  tickInterval = setInterval(() => {
    updateTrigger.value++
  }, TICK_INTERVAL_MS)
}

const stopTick = () => {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

const toggleAutoRefresh = () => {
  isAutoRefresh.value = !isAutoRefresh.value

  if (isAutoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  refreshInterval = setInterval(() => {
    refreshProofCodes()
  }, REFRESH_INTERVAL_MS)
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

onMounted(() => {
  refreshProofCodes()
  startAutoRefresh()
  startTick()
})

onUnmounted(() => {
  stopAutoRefresh()
  stopTick()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>