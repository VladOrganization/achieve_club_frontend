<template>
  <Dialog
      v-model:visible="isVisible"
      header="Подтверждение достижений"
      :modal="true"
      :draggable="false"
      class="w-full max-w-md"
      @hide="onHide"
      :pt="{
      header: { class: 'bg-gradient-to-r from-primary-400 to-primary-600 text-white border-0 rounded-xl' },
      title: { class: 'text-white font-bold' }
    }"
  >
    <!-- Содержимое модального окна -->
    <div class="space-y-3">
      <!-- Инструкция -->
      <div class="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-2">
        <p class="text-sm text-primary-900">
          🎯 Отсканируйте QR-код для подтверждения выполнения достижений
        </p>
      </div>

      <!-- Выбранные достижения (баджи) -->
      <div>
        <p class="text-sm font-medium text-stone-700 mb-3">
          Выбранные достижения:
        </p>
        <div class="flex flex-wrap gap-2">
          <Badge
              v-for="achievement in selectedAchievementsData"
              :key="achievement.id"
              :value="achievement.title"
              class="bg-primary-100 text-primary-800 px-3 py-2 rounded-full text-xs font-medium"
              :pt="{
              root: { class: 'bg-primary-100 text-primary-800' }
            }"
          />
        </div>
      </div>

      <!-- Информация -->
      <div class="grid grid-cols-2 gap-4 text-center">
        <div class="bg-green-50 rounded-lg p-3 border border-green-200">
          <p class="text-stone-600 text-xs">Достижений</p>
          <p class="text-2xl font-bold text-green-600">{{ selectedAchievements.length }}</p>
        </div>
        <div class="bg-primary-50 rounded-lg p-3 border border-primary-200">
          <p class="text-stone-600 text-xs">Всего XP</p>
          <p class="text-2xl font-bold text-primary-600">+{{ totalXP }}</p>
        </div>
      </div>

      <!-- QR Код -->
      <div class="bg-stone-50 rounded-lg p-2 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center">
        <div v-if="qrCodeData" class="bg-white p-4 rounded-lg shadow-md">
          <QRCode
              @click="showDebugInfo = !showDebugInfo"
              :value="qrCodeData"
              :options="{
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            }"
          />
        </div>
      </div>

      <!-- Информация для отладки (опционально) -->
      <div class="bg-stone-50 rounded-lg p-3 border border-stone-200" v-if="showDebugInfo">
        <p class="text-xs text-stone-600 mb-2 font-medium">Информация:</p>
        <p class="text-xs text-stone-500 break-all font-mono">
          ID студента: {{ studentId }}
        </p>
        <p class="text-xs text-stone-500 break-all font-mono mt-1">
          Достижения: {{ selectedAchievements.join(', ') }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <Button
          label="Отмена"
          severity="secondary"
          @click="onCancel"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import QRCode from 'qrcode.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  studentId: {
    type: Number,
    required: true,
  },
  selectedAchievements: {
    type: Array,
    default: () => [],
  },
  allAchievements: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'cancel'])

const isVisible = ref(false)

const showDebugInfo = ref(false)

// Синхронизация видимости с родителем
watch(
    () => props.modelValue,
    (newVal) => {
      isVisible.value = newVal
    }
)

watch(isVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// Получить данные выбранных достижений
const selectedAchievementsData = computed(() => {
  return props.allAchievements.filter((achievement) =>
      props.selectedAchievements.includes(achievement.id)
  )
})

// Общий XP выбранных достижений
const totalXP = computed(() => {
  return selectedAchievementsData.value.reduce((sum, a) => sum + a.xp, 0)
})

// Генерация QR кода
// QR код содержит JSON с информацией о студенте и достижениях
const qrCodeData = computed(() => {
  if (props.selectedAchievements.length === 0) return null

  const data = {
    studentId: props.studentId,
    achievementIds: props.selectedAchievements
  }

  // Кодируем в JSON и преобразуем в строку для QR
  return `${data.studentId}:${data.achievementIds.join(':')}`;
})

// Обработчики событий
const onCancel = () => {
  isVisible.value = false
  emit('cancel')
}

const onHide = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* Стили компонента */
</style>