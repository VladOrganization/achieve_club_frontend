<route lang="yaml">
meta:
  requiresAuth: true
</route>

<template>
  <div class="min-h-screen py-4 px-3 md:py-8 md:px-4">
    <div class="max-w-3xl mx-auto">
      <!-- Заголовок -->
      <div class="mb-4 md:mb-8">
        <h1 class="text-3xl font-bold text-stone-900">Топ студентов</h1>
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
          v-if="!isLoading && sortedStudents.length === 0"
          class="text-center py-12"
      >
        <i class="pi pi-inbox text-5xl text-stone-300 mb-4"></i>
        <p class="text-stone-500 text-lg">
          Нет студентов
        </p>
      </div>

      <!-- Список студентов: один столбец, по убыванию XP -->
      <ol
          v-if="!isLoading && sortedStudents.length > 0"
          class="flex flex-col gap-2"
      >
        <li
            v-for="(student, index) in sortedStudents"
            :key="student.id"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer flex items-center gap-2 p-2 pr-3 md:gap-3 md:p-2.5 md:pr-4"
            @click="goToStudentPage(student.id)"
        >
          <!-- Место -->
          <span
              class="w-5 md:w-7 shrink-0 text-center text-sm font-bold tabular-nums"
              :class="rankTextClass[ranks[student.id]] || 'text-stone-400'"
          >
            {{ index + 1 }}
          </span>

          <!-- Аватарка (у первых четырёх мест — рамка) -->
          <RankFrame :rank="ranks[student.id] || 0" :thickness="3" class="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-lg">
            <div
                class="w-full h-full overflow-hidden bg-stone-200"
                :class="ranks[student.id] ? 'rounded-[5px]' : 'rounded-lg'"
            >
              <UserAvatar
                  :src="student.avatar ? apiUrl(student.avatar) : ''"
                  :first-name="student.firstName"
                  :last-name="student.lastName"
              />
            </div>
          </RankFrame>

          <!-- Имя и XP в одной строке (XP справа сверху), под ними полоса прогресса на всю ширину -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <p class="min-w-0 text-base font-bold leading-tight text-stone-900 break-words line-clamp-2">
                {{ student.firstName }} {{ student.lastName }}
              </p>
              <div class="shrink-0 text-right leading-tight">
                <span class="text-sm md:text-base font-bold text-primary-600 tabular-nums">{{ formatNumber(student.xpSum) }}</span>
                <span class="text-xs font-medium text-stone-500 ml-1">XP</span>
              </div>
            </div>
            <LabeledProgress
                :value="completionPercent(student)"
                :label="`Завершено достижений: ${completionPercent(student)}%`"
                class="mt-1.5"
            />
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import LabeledProgress from '@/components/LabeledProgress.vue'
import RankFrame from '@/components/RankFrame.vue'
import {ranksOf, sortByXp} from '@/composables/useTopRanks'
import api from '@/api/client'
import {apiUrl} from '@/api/config'

const router = useRouter()

const allStudents = ref([])
const totalAchievements = ref(0) // всего достижений — для процента выполненных
const isLoading = ref(false)
const errorMessage = ref('')

// Получение студентов
const getStudents = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [studentsResponse, achievementsResponse] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/achievements'),
    ])
    allStudents.value = studentsResponse.data || []
    totalAchievements.value = (achievementsResponse.data || []).length
  } catch (error) {
    errorMessage.value =
        error.message || 'Ошибка при загрузке списка студентов'
    console.error('Error fetching students:', error)
  } finally {
    isLoading.value = false
  }
}

// Все студенты, всегда отсортированные по XP (от большего к меньшему)
const sortedStudents = computed(() => sortByXp(allStudents.value))

// Цвет номера места в тон рамки аватарки: алмаз, золото, серебро, бронза
const rankTextClass = {
  1: 'text-sky-500',
  2: 'text-yellow-500',
  3: 'text-slate-500',
  4: 'text-orange-400',
}

// Места первых четырёх студентов (id → 1..4), по ним рисуется рамка аватарки
const ranks = computed(() => ranksOf(allStudents.value))

// Процент выполненных достижений студента (CompletedCount считает бекенд)
const completionPercent = (student) => {
  if (!totalAchievements.value) return 0
  const percent = Math.round(((student.completedCount || 0) / totalAchievements.value) * 100)
  return Math.min(100, percent)
}

// Форматирование числа
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString('ru-RU')
}

// Переход на страницу студента
const goToStudentPage = (id) => {
  router.push(`/student/${id}`)
}

onMounted(async () => {
  await getStudents()
})
</script>

<style scoped>
/* Локальные стили компонента */
</style>