<route lang="yaml">
meta:
  requiresAuth: true
</route>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Заголовок и поиск -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Студенты</h1>
            <p class="text-gray-600 mt-1">
              Всего студентов: <span class="font-semibold">{{ totalStudents }}</span>
            </p>
          </div>

          <!-- Поиск -->
          <div class="relative">
            <InputGroup class="w-full md:w-64">
              <InputGroupAddon>
                <i class="pi pi-search"></i>
              </InputGroupAddon>
              <InputText
                  v-model="searchQuery"
                  placeholder="Поиск по имени..."
                  @input="handleSearch"
                  :pt="{
                  root: { class: 'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500' }
                }"
              />
            </InputGroup>
          </div>
        </div>

        <!-- Фильтры -->
        <div class="flex flex-wrap gap-3">
          <Button
              :label="`Все (${allStudents.length})`"
              :severity="sortBy === 'all' ? 'primary' : 'secondary'"
              text
              @click="sortBy = 'all'"
              :pt="{
              root: { class: sortBy === 'all' ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-700 hover:bg-gray-100' }
            }"
          />
          <Button
              label="По XP"
              :severity="sortBy === 'xp' ? 'primary' : 'secondary'"
              text
              @click="sortBy = 'xp'"
              :pt="{
              root: { class: sortBy === 'xp' ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-700 hover:bg-gray-100' }
            }"
          />
          <Button
              label="По имени"
              :severity="sortBy === 'name' ? 'primary' : 'secondary'"
              text
              @click="sortBy = 'name'"
              :pt="{
              root: { class: sortBy === 'name' ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-700 hover:bg-gray-100' }
            }"
          />
        </div>
      </div>

      <!-- Состояние загрузки -->
      <Skeleton v-if="isLoading" height="400px" />

      <!-- Сообщение об ошибке -->
      <Message
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mb-6 rounded-lg"
          @close="errorMessage = ''"
      />

      <!-- Сообщение о пустом списке -->
      <div
          v-if="!isLoading && filteredStudents.length === 0"
          class="text-center py-12"
      >
        <i class="pi pi-inbox text-5xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">
          {{ searchQuery ? 'Студенты не найдены' : 'Нет студентов' }}
        </p>
      </div>

      <!-- Список студентов (мобильный вид) -->
      <div
          v-if="!isLoading && filteredStudents.length > 0"
          class="md:hidden flex flex-col gap-3"
      >
        <div
            v-for="student in paginatedStudents"
            :key="student.id"
            class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer flex group"
            @click="goToStudentPage(student.id)"
        >
          <!-- Фото -->
          <div class="relative overflow-hidden w-24 h-24 bg-gray-200 flex-shrink-0">
            <img
                v-if="loadedImages[student.id]"
                :src="`https://byteschool.online:5001/${student.avatar}`"
                :alt="`${student.firstName} ${student.lastName}`"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                @error="handleImageError(student.id)"
            />
            <div
                v-else
                class="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center"
            >
              <i class="pi pi-user text-2xl text-white opacity-50"></i>
            </div>
          </div>

          <!-- Информация -->
          <div class="p-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="text-base font-bold text-gray-900 truncate">
                {{ student.firstName }}
              </h3>
              <p class="text-gray-600 text-xs truncate">
                {{ student.lastName }}
              </p>
            </div>

            <!-- XP -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-gray-700">XP</span>
                <span class="text-xs font-bold text-indigo-600">
                  {{ formatNumber(student.xpSum) }}
                </span>
              </div>
              <ProgressBar
                  :value="(student.xpSum % 1000) / 10"
                  :show-value="false"
                  :pt="{
                  root: { class: 'h-1 bg-gray-200' },
                  value: { class: 'bg-gradient-to-r from-indigo-500 to-blue-500' }
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Сетка студентов (планшет и десктоп) -->
      <div
          v-if="!isLoading && filteredStudents.length > 0"
          class="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <div
            v-for="student in paginatedStudents"
            :key="student.id"
            class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group"
            @click="goToStudentPage(student.id)"
        >
          <!-- Фото -->
          <div class="relative overflow-hidden h-48 bg-gray-200">
            <img
                v-if="loadedImages[student.id]"
                :src="`https://byteschool.online:5001/${student.avatar}`"
                :alt="`${student.firstName} ${student.lastName}`"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                @error="handleImageError(student.id)"
            />
            <div
                v-else
                class="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center group-hover:from-gray-400 group-hover:to-gray-500 transition-colors duration-300"
            >
              <i class="pi pi-user text-5xl text-white opacity-50"></i>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <div class="text-white p-3 w-full">
                <p class="text-sm font-medium">Просмотреть профиль</p>
              </div>
            </div>
          </div>

          <!-- Информация -->
          <div class="p-4">
            <h3 class="text-lg font-bold text-gray-900 truncate">
              {{ student.firstName }}
            </h3>
            <p class="text-gray-600 text-sm truncate mb-3">
              {{ student.lastName }}
            </p>

            <!-- XP -->
            <div class="mb-3">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700">XP</span>
                <span class="text-sm font-bold text-indigo-600">
                  {{ formatNumber(student.xpSum) }}
                </span>
              </div>
              <ProgressBar
                  :value="(student.xpSum % 1000) / 10"
                  :show-value="false"
                  :pt="{
                  root: { class: 'h-2 bg-gray-200' },
                  value: { class: 'bg-gradient-to-r from-indigo-500 to-blue-500' }
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div
          v-if="!isLoading && filteredStudents.length > itemsPerPage"
          class="mt-8 flex justify-center"
      >
        <Paginator
            :rows="itemsPerPage"
            :total-records="filteredStudents.length"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            :pt="{
            root: { class: 'bg-white border border-gray-200 rounded-lg' },
            firstPageButton: { class: 'text-indigo-600 hover:text-indigo-800' },
            prevPageButton: { class: 'text-indigo-600 hover:text-indigo-800' },
            nextPageButton: { class: 'text-indigo-600 hover:text-indigo-800' },
            lastPageButton: { class: 'text-indigo-600 hover:text-indigo-800' },
            pageButton: ({ context }) => ({
              class: context.active ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100'
            })
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import ProgressBar from 'primevue/progressbar'
import Paginator from 'primevue/paginator'
import api from '@/api/client'

const router = useRouter()

const allStudents = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const sortBy = ref('all')
const currentPage = ref(0)
const itemsPerPage = ref(12)
const loadedImages = ref({})

// Получение студентов
const getStudents = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get(
        '/api/users'
    )
    allStudents.value = response.data || []

    // Инициализация флагов загрузки изображений
    allStudents.value.forEach(student => {
      loadedImages.value[student.id] = true
    })
  } catch (error) {
    errorMessage.value =
        error.message || 'Ошибка при загрузке списка студентов'
    console.error('Error fetching students:', error)
  } finally {
    isLoading.value = false
  }
}

// Фильтрация и сортировка
const filteredStudents = computed(() => {
  let result = [...allStudents.value]

  // Поиск по имени и фамилии
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
        (student) =>
            student.firstName.toLowerCase().includes(query) ||
            student.lastName.toLowerCase().includes(query)
    )
  }

  // Сортировка
  if (sortBy.value === 'xp') {
    result.sort((a, b) => (b.xpSum || 0) - (a.xpSum || 0))
  } else if (sortBy.value === 'name') {
    result.sort((a, b) =>
        a.firstName.localeCompare(b.firstName, 'ru')
    )
  }

  return result
})

// Пагинированные студенты
const paginatedStudents = computed(() => {
  const start = currentPage.value * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredStudents.value.slice(start, end)
})

// Общее количество студентов
const totalStudents = computed(() => allStudents.value.length)

// Форматирование числа
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('ru-RU')
}

// Обработка ошибки загрузки изображения
const handleImageError = (studentId) => {
  loadedImages.value[studentId] = false
}

// Обработка поиска
const handleSearch = () => {
  currentPage.value = 0
}

// Переход на страницу студента
const goToStudentPage = (id) => {
  router.push(`/student/${id}`)
}

// Обработка изменения страницы
const onPageChange = (event) => {
  currentPage.value = event.page
}

onMounted(async () => {
  await getStudents()
})
</script>

<style scoped>
/* Локальные стили компонента */
</style>