<route lang="yaml">
meta:
  requiresAuth: true
</route>

<template>
  <div class="min-h-screen bg-canvas py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Состояние загрузки -->
      <Skeleton v-if="isLoading" height="600px" />

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
          <div class="h-32 bg-gradient-to-r from-brand-500 to-brand-800"></div>
          <div class="px-6 pb-6">
            <div class="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-6">
              <!-- Аватарка -->
              <div class="relative">
                <img
                    v-if="loadedImages.avatar"
                    :src="`https://byteschool.online:5001/${student.avatar}`"
                    :alt="`${student.firstName} ${student.lastName}`"
                    class="w-32 h-32 rounded-lg shadow-lg object-cover border-4 border-white"
                    @error="handleImageError('avatar')"
                />
                <div
                    v-else
                    class="w-32 h-32 rounded-lg shadow-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-4 border-white"
                >
                  <i class="pi pi-user text-5xl text-white opacity-50"></i>
                </div>
              </div>

              <!-- Информация профиля -->
              <div class="flex-1">
                <h1 class="text-3xl font-bold text-gray-900">
                  {{ student.firstName }} {{ student.lastName }}
                </h1>
              </div>

              <!-- Кнопка назад -->
              <Button
                  icon="pi pi-sign-out"
                  label="Выйти"
                  severity="secondary"
                  @click="signOut"
                  :pt="{
                  root: { class: 'px-4 py-2 rounded-lg' }
                }"
              />
            </div>

            <!-- Статистика -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                <p class="text-gray-600 text-sm font-medium">Общий опыт</p>
                <p class="text-3xl font-bold text-brand-600 mt-2">
                  {{ formatNumber(student.xpSum) }}
                </p>
                <p class="text-gray-600 text-xs mt-1">XP</p>
              </div>

              <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                <p class="text-gray-600 text-sm font-medium">Выполненные достижения</p>
                <p class="text-3xl font-bold text-green-600 mt-2">
                  {{ completedAchievements.length }}
                </p>
                <p class="text-gray-600 text-xs mt-1">
                  из {{ totalAchievements }}
                </p>
              </div>

              <div class="bg-brand-50 rounded-lg p-4 border border-brand-200">
                <p class="text-gray-600 text-sm font-medium">Процент завершения</p>
                <p class="text-3xl font-bold text-accent-500 mt-2">
                  {{ completionPercentage }}%
                </p>
                <ProgressBar
                    :value="completionPercentage"
                    :show-value="false"
                    class="mt-3 h-2 bg-brand-200"
                    :pt="{
                    root: { class: 'h-2 bg-brand-200' },
                    value: { class: 'bg-gradient-to-r from-gold-500 to-accent-500' }
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <ReceivedOrderHistory :orders="receivedOrders" />

        <!-- Вкладки достижений -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <TabView>
            <!-- Вкладка выполненных достижений -->
            <TabPanel
                header="Выполненные"
                :header-style="{ 'flex': '1 1 0', 'display': 'flex' }"
                :pt="{ headerAction: { class: 'w-full justify-center !flex !flex-1' }
            }">
              <div class="p-6">
                <div
                    v-if="completedAchievements.length === 0"
                    class="text-center py-12"
                >
                  <i class="pi pi-inbox text-5xl text-gray-300 mb-4"></i>
                  <p class="text-gray-500 text-lg">
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
                      <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center flex-shrink-0 border-2 border-green-300">
                        <img
                            v-if="loadedImages[achievement.id]"
                            :src="`https://byteschool.online:5001/${achievement.logoURL}`"
                            :alt="achievement.title"
                            class="w-12 h-12 object-contain"
                            @error="handleImageError(achievement.id)"
                        />
                        <i v-else class="pi pi-check text-3xl text-green-500"></i>
                      </div>
                      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg shadow-md text-center">
                        <p class="text-xs font-bold">+{{ achievement.xp }}</p>
                        <p class="text-xs">XP</p>
                      </div>
                    </div>

                    <!-- Информация -->
                    <h3 class="font-bold text-gray-900 text-sm mb-2">
                      {{ achievement.title }}
                    </h3>
                    <p class="text-gray-700 text-xs mb-3 line-clamp-2">
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
            </TabPanel>

            <!-- Вкладка невыполненных достижений -->
            <TabPanel header="Невыполненные"
                      :header-style="{ 'flex': '1 1 0', 'display': 'flex' }"
                      :pt="{ headerAction: { class: 'w-full justify-center !flex !flex-1' }
            }">
              <div class="p-6">
                <!-- Инструкция -->
                <div
                    v-if="uncompletedAchievements.length > 0"
                    class="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-4"
                >
                  <p class="text-sm text-brand-800">
                    💡 Выберите достижения, которые были выполнены, и нажмите кнопку внизу
                  </p>
                </div>

                <div
                    v-if="uncompletedAchievements.length === 0"
                    class="text-center py-12"
                >
                  <i class="pi pi-check-circle text-5xl text-green-300 mb-4"></i>
                  <p class="text-gray-500 text-lg">
                    Все достижения выполнены!
                  </p>
                </div>

                <div
                    v-else
                    class="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div
                      v-for="achievement in uncompletedAchievements"
                      :key="achievement.id"
                      :class="[
                      'bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 cursor-pointer transition-all duration-300',
                      selectedAchievements.includes(achievement.id)
                        ? 'border-brand-500 shadow-lg bg-brand-50 to-brand-100'
                        : 'border-gray-300 hover:shadow-md opacity-75 hover:opacity-100'
                    ]"
                      @click="toggleAchievementSelection(achievement.id)"
                  >
                    <!-- Checkbox и логотип -->
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-start gap-3">
                        <div class="w-16 h-16 bg-white rounded-lg shadow-md flex items-center justify-center flex-shrink-0 border-2 border-gray-300">
                          <img
                              v-if="loadedImages[achievement.id]"
                              :src="`https://byteschool.online:5001/${achievement.logoURL}`"
                              :alt="achievement.title"
                              class="w-12 h-12 object-contain"
                              :class="{
                              'opacity-100': selectedAchievements.includes(achievement.id),
                              'opacity-50': !selectedAchievements.includes(achievement.id)
                            }"
                              @error="handleImageError(achievement.id)"
                          />
                          <i
                              v-else
                              class="pi pi-lock text-3xl"
                              :class="{
                              'text-brand-500': selectedAchievements.includes(achievement.id),
                              'text-gray-400': !selectedAchievements.includes(achievement.id)
                            }"
                          ></i>
                        </div>
                      </div>
                      <div
                          :class="[
                          'text-white px-3 py-2 rounded-lg shadow-md text-center',
                          selectedAchievements.includes(achievement.id)
                            ? 'bg-gradient-to-r from-brand-500 to-brand-700'
                            : 'bg-gray-400'
                        ]"
                      >
                        <p class="text-xs font-bold">+{{ achievement.xp }}</p>
                        <p class="text-xs">XP</p>
                      </div>
                    </div>

                    <!-- Информация -->
                    <h3 class="font-bold text-gray-900 text-sm mb-2">
                      {{ achievement.title }}
                    </h3>
                    <p class="text-gray-700 text-xs mb-3 line-clamp-2">
                      {{ achievement.description }}
                    </p>

                    <!-- Статус -->
                    <div>
                      <span
                          :class="[
                          'inline-block px-3 py-1 rounded-full text-xs font-bold',
                          selectedAchievements.includes(achievement.id)
                            ? 'bg-brand-500 text-white'
                            : 'bg-canvas0 text-white'
                        ]"
                      >
                        {{
                          selectedAchievements.includes(achievement.id)
                              ? '✓ Выбрано'
                              : '🔒 Не выполнено'
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>

      <!-- Фиксированная кнопка выполнения -->
      <Transition name="slide-up">
        <div
            v-if="selectedAchievements.length > 0"
            class="fixed bottom-8 right-8 flex flex-col gap-2 z-50"
        >
          <div class="bg-white rounded-lg shadow-lg p-4 border-l-4 border-brand-600">
            <p class="text-sm font-medium text-gray-900 mb-3">
              Выбрано достижений: <span class="text-brand-600 font-bold">{{ selectedAchievements.length }}</span>
            </p>
            <p class="text-xs text-gray-600 mb-3">
              XP к получению: <span class="text-green-600 font-bold">+{{ totalSelectedXP }}</span>
            </p>
            <div class="flex gap-2">
              <Button
                  label="Отмена"
                  severity="secondary"
                  size="small"
                  @click="clearSelection"
                  :pt="{
                  root: { class: 'px-3 py-2' }
                }"
              />
              <Button
                  :label="`Выполнить (${selectedAchievements.length})`"
                  severity="success"
                  size="small"
                  :loading="isSubmitting"
                  @click="openModal"
                  :pt="{
                  root: { class: 'px-3 py-2' }
                }"
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Модальное окно подтверждения -->
      <template v-if="student">
        <CompleteAchievementsModal
            v-model="showModal"
            :student-id="student.id"
            :selected-achievements="selectedAchievements"
            :all-achievements="allAchievements"
            :is-submitting="isSubmitting"
            @confirm="completeSelectedAchievements"
            @cancel="showModal = false"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ProgressBar from 'primevue/progressbar'
import Checkbox from 'primevue/checkbox'
import CompleteAchievementsModal from '@/components/CompleteAchievementsModal.vue'
import ReceivedOrderHistory from '@/components/shop/ReceivedOrderHistory.vue'
import api from '@/api/client'
import {useAuthStore} from "@/stores/auth.js";
import { isReceivedStatus } from '@/utils/media'
const router = useRouter()
const authStore = useAuthStore()

const student = ref(null)
const allAchievements = ref([])
const completedAchievementIds = ref([])
const selectedAchievements = ref([])
const showModal = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const loadedImages = ref({ avatar: true })
const shopOrders = ref([])

const receivedOrders = computed(() =>
    shopOrders.value.filter((o) => isReceivedStatus(o.deliveryStatus))
)

// Получение всех данных
const loadStudentData = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // 1. Получить информацию о студенте
    const studentResponse = await api.get(
        `/api/users/current`
    )
    student.value = studentResponse.data

    // 2. Получить все достижения
    const achievementsResponse = await api.get(
        '/api/achievements'
    )
    allAchievements.value = achievementsResponse.data || []

    // 3. Получить выполненные достижения студента
    const completedResponse = await api.get(
        `/api/CompletedAchievements/current`
    )
    // Сохранить ID выполненных достижений
    completedAchievementIds.value = (completedResponse.data || []).map(
        (a) => a.achieveId
    )

    // Инициализировать флаги загрузки изображений
    allAchievements.value.forEach((achievement) => {
      loadedImages.value[achievement.id] = true
    })

    try {
      const ordersResponse = await api.get('/api/orders')
      shopOrders.value = ordersResponse.data || []
    } catch {
      shopOrders.value = []
    }
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

// Невыполненные достижения
const uncompletedAchievements = computed(() => {
  return allAchievements.value.filter(
      (a) => !completedAchievementIds.value.includes(a.id)
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

// Общий XP выбранных достижений
const totalSelectedXP = computed(() => {
  return allAchievements.value
      .filter((a) => selectedAchievements.value.includes(a.id))
      .reduce((sum, a) => sum + a.xp, 0)
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

// Переключение выбора достижения
const toggleAchievementSelection = (achievementId) => {
  const index = selectedAchievements.value.indexOf(achievementId)
  if (index > -1) {
    selectedAchievements.value.splice(index, 1)
  } else {
    selectedAchievements.value.push(achievementId)
  }
}

// Очистка выбора
const clearSelection = () => {
  selectedAchievements.value = []
}

// Открытие модального окна
const openModal = () => {
  showModal.value = true
}

// Выполнение выбранных достижений
const completeSelectedAchievements = async () => {
  if (selectedAchievements.value.length === 0) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {

    // Добавить выбранные достижения в завершенные
    completedAchievementIds.value = [
      ...completedAchievementIds.value,
      ...selectedAchievements.value
    ]

    // Очистить выбор
    selectedAchievements.value = []

    // Закрыть модальное окно
    showModal.value = false

    // Показать успешное сообщение
    errorMessage.value = '' // Очистить ошибку
  } catch (error) {
    errorMessage.value =
        error.message || 'Ошибка при выполнении достижений'
    console.error('Error completing achievements:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Выйти из профиля
const signOut = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

/* В PV4 главный контейнер теперь .p-tabview-tablist */
:deep(.p-tabview-tablist) {
  display: flex !important;
  width: 100% !important;
}

/* Элементы списка вкладок */
:deep(.p-tabview-tab) {
  flex: 1 1 0 !important; /* Занимают равное место */
  display: flex !important;
}

/* Кнопка внутри вкладки */
:deep(.p-tabview-tab-button) {
  width: 100% !important;
  justify-content: center !important;
  display: flex !important;
}
:deep(.p-tabview-tablist) {
  display: flex !important;
  width: 100% !important;
}

/* 2. Растягиваем элементы LI (теперь они называются так) */
:deep(.p-tabview-tablist-item) {
  flex: 1 1 0 !important; /* Делим 50/50 */
  display: flex !important;
}

/* 3. Растягиваем саму кнопку (ссылку) внутри LI */
:deep(.p-tabview-tab) {
  width: 100% !important;
  display: flex !important;
  justify-content: center !important; /* Текст в центр */
  flex: 1 !important;
}
</style>