<template>
  <div class="flex flex-col items-center gap-3 w-full">
    <!-- Предпросмотр выбранной аватарки -->
    <div
        class="w-32 h-32 overflow-hidden bg-stone-200 flex items-center justify-center shrink-0"
        :class="rounded ? 'rounded-full' : 'rounded-lg'"
    >
      <img
          v-if="previewSrc"
          :src="previewSrc"
          alt="Предпросмотр аватарки"
          class="w-full h-full object-cover"
      />
      <slot v-else name="placeholder">
        <i class="pi pi-user text-7xl text-stone-400"></i>
      </slot>
    </div>

    <SelectButton
        v-model="mode"
        :options="modes"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        :disabled="disabled"
    />

    <!-- Свой файл -->
    <template v-if="mode === 'upload'">
      <input
          ref="fileInput"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.bmp,.gif"
          class="hidden"
          @change="onFileSelected"
      />
      <Button
          :label="file ? 'Выбрать другое фото' : 'Выбрать фото'"
          icon="pi pi-image"
          severity="secondary"
          :disabled="disabled"
          @click="fileInput.click()"
      />
    </template>

    <!-- Предзагруженные аватарки -->
    <template v-else>
      <div v-if="isLoading" class="text-stone-500 py-4">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>
      <p v-else-if="loadError" class="text-sm text-red-500 py-2">Не удалось загрузить список аватарок</p>
      <p v-else-if="presets.length === 0" class="text-sm text-stone-500 py-2">Список аватарок пока пуст</p>
      <div v-else class="w-full max-h-64 overflow-y-auto">
        <!-- Прокрутка во внешнем блоке: если ограничить высоту самой сетки, строки сжимаются и плитки наезжают друг на друга -->
        <div class="grid grid-cols-4 gap-2 p-1">
          <button
              v-for="preset in presets"
              :key="preset"
              type="button"
              class="aspect-square overflow-hidden bg-stone-100 transition-shadow cursor-pointer disabled:cursor-default"
              :class="[
                rounded ? 'rounded-full' : 'rounded-lg',
                presetPath === preset ? 'ring-3 ring-primary-500' : 'hover:ring-2 hover:ring-primary-200',
              ]"
              :disabled="disabled"
              :aria-pressed="presetPath === preset"
              aria-label="Выбрать эту аватарку"
              @click="presetPath = preset"
          >
            <img :src="apiUrl(preset)" alt="" class="block w-full h-full object-cover" loading="lazy"/>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import {apiUrl} from '@/api/config'
import {fetchAvatarPresets} from '@/api/avatars.js'

// Выбор: null | {type: 'file', file: File} | {type: 'preset', path: string}
const selection = defineModel({default: null})

defineProps({
  disabled: {type: Boolean, default: false},
  // Круглые превью (регистрация) или со скруглёнными углами (профиль)
  rounded: {type: Boolean, default: true},
})

const emit = defineEmits(['error'])

const MAX_AVATAR_SIZE = 10_000_000

const modes = [
  {label: 'Своё фото', value: 'upload'},
  {label: 'Из списка', value: 'preset'},
]

// Восстанавливаем уже сделанный выбор (например, после возврата на предыдущий шаг регистрации)
const mode = ref(selection.value?.type === 'preset' ? 'preset' : 'upload')
const fileInput = ref(null)
const file = ref(selection.value?.type === 'file' ? selection.value.file : null)
const filePreview = ref(file.value ? URL.createObjectURL(file.value) : '')
const presetPath = ref(selection.value?.type === 'preset' ? selection.value.path : null)
const presets = ref([])
const isLoading = ref(false)
const loadError = ref(false)

const previewSrc = computed(() => {
  if (mode.value === 'upload') return filePreview.value
  return presetPath.value ? apiUrl(presetPath.value) : ''
})

// Каждая вкладка помнит свой выбор, наружу отдаём выбор активной вкладки
watch([mode, file, presetPath], () => {
  if (mode.value === 'upload') {
    selection.value = file.value ? {type: 'file', file: file.value} : null
  } else {
    selection.value = presetPath.value ? {type: 'preset', path: presetPath.value} : null
  }
})

const onFileSelected = (event) => {
  const selected = event.target.files?.[0]
  event.target.value = ''
  if (!selected) return

  if (!selected.type.startsWith('image/')) {
    emit('error', 'Выберите файл изображения')
    return
  }
  if (selected.size > MAX_AVATAR_SIZE) {
    emit('error', 'Файл слишком большой (максимум 10 МБ)')
    return
  }

  emit('error', '')
  if (filePreview.value) URL.revokeObjectURL(filePreview.value)
  file.value = selected
  filePreview.value = URL.createObjectURL(selected)
}

onMounted(async () => {
  isLoading.value = true
  try {
    presets.value = await fetchAvatarPresets()
  } catch {
    loadError.value = true
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (filePreview.value) URL.revokeObjectURL(filePreview.value)
})
</script>
