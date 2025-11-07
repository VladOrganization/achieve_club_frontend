<route lang="yaml">
meta:
requiresAuth: true
requiresRoles: ['admin', 'supervisor']
</route>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2">
    <div class="max-w-2xl mx-auto">
      <!-- Если данные не отсканированы -->
      <div v-if="!scannedData" class="bg-white rounded-lg shadow-lg p-2">
        <div class="mb-2">
          <p class="text-gray-600">
            📱 Отсканируйте QR-код для выполнения достижения
          </p>
          <qrcode-stream
              @detect="onDetect"
              @error="onError"
              class="w-full rounded-lg overflow-hidden border-2 border-blue-300"
          />
        </div>

        <!-- Сообщение об ошибке -->
        <Message
            v-if="errorMessage"
            severity="error"
            class="w-full">
          {{ errorMessage }}
        </Message>

        <!-- Результат сканирования -->
        <Message
            v-if="detectedCodes"
            severity="success"
            class="w-full">
          {{ detectedCodes[0].rawValue }}
        </Message>
      </div>

      <!-- Если данные отсканированы -->
      <div v-else class="bg-white rounded-lg shadow-lg p-2">
        <!-- Информация о студенте -->
        <div
            class="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50
                 rounded-lg border border-blue-200"
        >
          <h2 class="text-2xl font-bold text-gray-800">👤 {{ studentInfo }}</h2>
        </div>

        <!-- Список достижений -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            🏆 Достижения
          </h2>

          <div v-if="achievementsList.length > 0" class="space-y-3">
            <div
                v-for="achievement in achievementsList"
                :key="achievement.id"
                class="flex items-center justify-between p-2 bg-gradient-to-r
                     from-amber-50 to-yellow-50 rounded-lg border
                     border-amber-200 hover:shadow-md transition-shadow"
            >
              <Button @click="removeAchievement(achievement.id)" icon="pi pi-trash" size="small" class="mr-2" aria-label="Save" severity="danger"/>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">
                  {{ achievement.title }}
                </h3>
                <p class="text-sm text-gray-600">
                  {{ achievement.description }}
                </p>
              </div>
              <div class="ml-4 text-right">
                <span
                    class="inline-block px-3 py-1 bg-yellow-200
                         text-yellow-800 rounded-full font-bold text-sm">
                  +{{ achievement.xp }} опыта
                </span>
              </div>
            </div>
          </div>

          <div
              v-else
              class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg"
          >
            Достижения не найдены
          </div>
        </div>

        <!-- Суммарная информация -->
        <div
            class="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50
                 rounded-lg border-2 border-green-300"
        >
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            ✨ Суммарный опыт
          </h3>
          <div class="flex gap-2">
          <p class="text-4xl font-bold text-green-600">
            {{ totalExperience }}
            <span class="text-lg text-gray-600">опыта</span>
          </p>
          <p class="text-4xl font-bold text-blue-600">
            {{ achievementsList.length }}
            <span class="text-lg text-gray-600">{{ countText }}</span>
          </p>
          </div>
        </div>

        <!-- Кнопки действия -->
        <div class="flex gap-4">
          <Button
              label="Выполнить"
              icon="pi pi-check"
              class="flex-1"
              size="large"
              @click="completeAchievements"
              :loading="isLoading"
              severity="success"
          />

          <Button
              label="Отмена"
              icon="pi pi-times"
              class="flex-1"
              size="large"
              @click="resetScan"
              severity="secondary"
          />
        </div>
      </div>

      <!-- Toast -->
      <Toast
          :pt="{
          root: {
            class: 'p-4'
          },
          message: {
            class: 'ml-3'
          },
          summary: {
            class: 'font-bold text-base'
          },
          detail: {
            class: 'text-sm mt-1'
          },
          closeButton: {
            class: 'hover:bg-opacity-20 rounded-full'
          }
        }"
      />
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {QrcodeStream} from 'vue-qrcode-reader'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import {useToast} from 'primevue/usetoast'
import api from '@/api/client'

const toast = useToast()

// Реактивные переменные
const scannedData = ref(null)
const errorMessage = ref('')
const scanSuccess = ref(false)
const isLoading = ref(false)
const detectedCodes = ref()

const achievementsDb = ref([])

// Информация о студенте
const studentInfo = ref(null)

onMounted(async () => {
  const achievementsResponse = await api.get(
      '/api/achievements'
  )
  achievementsDb.value = achievementsResponse.data || []
})

const removeAchievement = (achievementId) => {
  if (!scannedData.value) return

  scannedData.value.achievementIds = scannedData.value.achievementIds.filter(
      id => id !== achievementId
  )
}

// Список достижений
const achievementsList = computed(() => {
  if (!scannedData.value || !scannedData.value.achievementIds) return []
  return scannedData.value.achievementIds
      .map(id => achievementsDb.value[id])
      .filter(Boolean)
})

// Суммарный опыт
const totalExperience = computed(() => {
  return achievementsList.value.reduce(
      (sum, achievement) => sum + achievement.xp,
      0
  )
})

const countText = computed(() => {
  const count = achievementsList.value.length

  if (count < 1) return ''
  else if (count === 1) return 'достижение'
  else if (count <= 4) return 'достижения'
  else return 'достижений'
})

// Функция для обработки сканирования
const onDetect = detectedCodes => {
  if (!detectedCodes || detectedCodes.length === 0) return

  const decodedText = detectedCodes[0]?.rawValue

  if (!decodedText) return

  console.log("scan", decodedText)

  try {
    // Парсируем QR-код: studentId:achievement1Id:achievement2Id:...
    const parts = decodedText.split(':')
    if (parts.length < 2) {
      throw new Error(
          'Неверный формат QR-кода. Ожидается: студент:ачивка-1:...:ачивка-N'
      )
    }

    const studentId = parts[0]
    const achievementIds = parts.slice(1)

    scannedData.value = {
      studentId,
      achievementIds
    }

    api.get('/api/users/'+scannedData.value.studentId).then((response) => {
      console.log(response)
      studentInfo.value = `${response.data.firstName} ${response.data.lastName}`
    })

    scanSuccess.value = true
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message
    scanSuccess.value = false
  }
}

// Функция для обработки ошибок
const onError = error => {
  console.error('Ошибка сканирования:', error)
  errorMessage.value = `Ошибка: ${error.title || error.message}`
}

// Выполнение достижений
const completeAchievements = async () => {
  if (!scannedData.value) return

  isLoading.value = true

  try {
    await api.post('api/completedachievements', {
      "userId": scannedData.value.studentId,
      "achievementIds": scannedData.value.achievementIds
    })

    toast.add({
      severity: 'success',
      summary: 'Успешно!',
      detail: `Достижения для студента ${studentInfo.value}
               выполнены. Опыт: ${totalExperience.value}`,
      life: 3000
    })

    resetScan()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось выполнить достижения',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

// Сброс сканирования
const resetScan = () => {
  scannedData.value = null
  errorMessage.value = ''
  scanSuccess.value = false
}
</script>

<style scoped>
/* Используем только Tailwind классы и Pass-Through API */
</style>