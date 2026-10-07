<route lang="yaml">
meta:
requiresAuth: true
</route>

<template>
  <div class="min-h-screen py-4 px-3 md:py-8 md:px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Состояние загрузки -->
      <Skeleton v-if="isLoading" height="600px"/>

      <!-- Сообщение об ошибке -->
      <Message
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mb-6 rounded-lg"
          @close="errorMessage = ''"
      />

      <!-- Профиль студента -->
      <div v-if="!isLoading && student" class="space-y-6">
        <!-- Карточка профиля -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <ProfileCover/>
          <div class="px-4 pb-4 md:px-6 md:pb-6">
            <div class="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-6">
              <!-- Аватарка -->
              <div class="relative">
                <!-- Рамка для первых четырёх мест в топе (без места — обычная белая обводка) -->
                <RankFrame :rank="rank" :thickness="4" reserve plain-class="bg-white" class="w-32 h-32 rounded-lg shadow-lg">
                  <div class="w-full h-full rounded-[4px] overflow-hidden">
                    <UserAvatar
                        :src="student.avatar ? apiUrl(student.avatar) : ''"
                        :first-name="student.firstName"
                        :last-name="student.lastName"
                    />
                  </div>
                </RankFrame>
              </div>

              <!-- Информация профиля -->
              <div class="flex-1 min-w-0">
                <h1 class="text-2xl sm:text-3xl font-bold leading-tight text-stone-900 break-words line-clamp-3">
                  {{ student.firstName }} {{ student.lastName }}
                </h1>
              </div>

              <!-- Кнопка назад -->
              <Button
                  icon="pi pi-arrow-left"
                  label="Назад"
                  severity="secondary"
                  @click="goBack"
                  :pt="{
                  root: { class: 'px-4 py-2 rounded-lg' }
                }"
              />
            </div>

            <!-- Статистика: у всех карточек одинаковая структура — заголовок, значение, нижняя строка на одной высоте -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div class="flex flex-col rounded-lg p-3 md:p-4 border bg-primary-50 border-primary-200">
                <p class="text-stone-600 text-sm font-medium leading-5">Общий опыт</p>
                <p class="text-3xl font-bold leading-9 text-primary-600 mt-2">
                  {{ formatNumber(student.xpSum) }}
                </p>
                <div class="mt-3 h-4 flex items-center text-stone-600 text-xs">XP</div>
              </div>

              <div class="flex flex-col rounded-lg p-3 md:p-4 border bg-green-50 border-green-200">
                <p class="text-stone-600 text-sm font-medium leading-5">Выполненные достижения</p>
                <p class="text-3xl font-bold leading-9 text-green-600 mt-2">
                  {{ completedAchievements.length }}
                </p>
                <div class="mt-3 h-4 flex items-center text-stone-600 text-xs">
                  из {{ totalAchievements }}
                </div>
              </div>

              <div class="flex flex-col rounded-lg p-3 md:p-4 border bg-amber-50 border-amber-200">
                <p class="text-stone-600 text-sm font-medium leading-5">Процент завершения</p>
                <p class="text-3xl font-bold leading-9 text-amber-600 mt-2">
                  {{ completionPercentage }}%
                </p>
                <div class="mt-3 h-4 flex items-center">
                  <ProgressBar
                      :value="completionPercentage"
                      :show-value="false"
                      class="w-full"
                      :pt="{
                      root: { class: 'h-2 !bg-amber-200 rounded-full' },
                      value: { class: 'bg-gradient-to-r from-amber-400 to-primary-500 rounded-full' }
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Вкладки достижений -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="p-6">
            <div
                v-if="completedAchievements.length === 0"
                class="text-center py-12"
            >
              <i class="pi pi-inbox text-5xl text-stone-300 mb-4"></i>
              <p class="text-stone-500 text-lg">
                Выполненные достижения не найдены
              </p>
            </div>

            <div
                v-else
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div
                  v-for="achievement in completedAchievements"
                  :key="achievement.id"
                  class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-300 hover:shadow-md transition-shadow duration-300"
              >
                <!-- Логотип и награда -->
                <div class="flex items-start justify-between mb-4">
                  <div
                      class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center flex-shrink-0 border-2 border-green-300">
                    <img
                        v-if="loadedImages[achievement.id]"
                        :src="apiUrl(achievement.logoURL)"
                        :alt="achievement.title"
                        class="w-12 h-12 object-contain"
                        @error="handleImageError(achievement.id)"
                    />
                    <i v-else class="pi pi-check text-3xl text-green-500"></i>
                  </div>
                  <div
                      class="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg shadow-md text-center">
                    <p class="text-xs font-bold">+{{ achievement.xp }}</p>
                    <p class="text-xs">XP</p>
                  </div>
                </div>

                <!-- Информация -->
                <h3 class="font-bold text-stone-900 text-sm mb-2">
                  {{ achievement.title }}
                </h3>
                <p class="text-stone-700 text-xs mb-3 line-clamp-2">
                  {{ achievement.description }}
                </p>

                <!-- Статус -->
                <div>
                      <span class="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        ✓ Выполнено
                      </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import ProgressBar from 'primevue/progressbar'
import RankFrame from '@/components/RankFrame.vue'
import {useTopRanks} from '@/composables/useTopRanks'
import api from '@/api/client'
import {apiUrl} from '@/api/config'

const router = useRouter()
const route = useRoute()

const student = ref(null)

// Место в топе (1–4) для рамки аватарки
const {ranks, load: loadRanks} = useTopRanks()
const rank = computed(() => ranks.value[student.value?.id] || 0)
const allAchievements = ref([])
const completedAchievementIds = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const loadedImages = ref({avatar: true})

const studentId = ref(route.params.id)

// Получение всех данных
const loadStudentData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // 1. Получить информацию о студенте
    const studentResponse = await api.get(
        `/api/users/${studentId.value}`
    )
    student.value = studentResponse.data

    // 2. Получить все достижения
    const achievementsResponse = await api.get(
        '/api/achievements'
    )
    allAchievements.value = achievementsResponse.data || []

    // 3. Получить выполненные достижения студента
    const completedResponse = await api.get(
        `/api/CompletedAchievements/${studentId.value}`
    )
    // Сохранить ID выполненных достижений
    completedAchievementIds.value = (completedResponse.data || []).map(
        (a) => a.achieveId
    )

    // Инициализировать флаги загрузки изображений
    allAchievements.value.forEach((achievement) => {
      loadedImages.value[achievement.id] = true
    })
  } catch (error) {
    errorMessage.value =
        error.message || 'Ошибка при загрузке данных студента'
    console.error('Error fetching student data:', error)
  } finally {
    isLoading.value = false
  }
}

// Выполненные достижения
const completedAchievements = computed(() => {
  return allAchievements.value.filter((a) =>
      completedAchievementIds.value.includes(a.id)
  )
})

// Общее количество достижений
const totalAchievements = computed(() => allAchievements.value.length)

// Процент завершения
const completionPercentage = computed(() => {
  if (totalAchievements.value === 0) return 0
  return Math.round(
      (completedAchievements.value.length / totalAchievements.value) * 100
  )
})

// Форматирование числа
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('ru-RU')
}

// Обработка ошибки загрузки изображения
const handleImageError = (field) => {
  loadedImages.value[field] = false
}

// Возвращение назад
const goBack = () => {
  router.back()
}

onMounted(async () => {
  loadRanks()
  await loadStudentData()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>