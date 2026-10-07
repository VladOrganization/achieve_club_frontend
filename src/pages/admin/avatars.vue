<route lang="yaml">
meta:
  requiresAuth: true
  requiresRoles: ['admin']
</route>

<template>
  <div class="min-h-screen py-6 px-4">
    <Toast/>
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-stone-900">Аватарки</h1>
          <p class="text-stone-600 mt-1">
            Готовые аватарки, из которых пользователи выбирают при регистрации и в профиле.
            Всего: <span class="font-semibold">{{ presets.length }}</span>
          </p>
        </div>
        <PrimeButton
            :label="isUploading ? 'Загрузка...' : 'Добавить'"
            :icon="isUploading ? 'pi pi-spin pi-spinner' : 'pi pi-plus'"
            :disabled="isUploading"
            @click="fileInput.click()"
        />
        <input
            ref="fileInput"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.bmp,.gif"
            multiple
            class="hidden"
            @change="onFilesSelected"
        />
      </div>

      <div v-if="isLoading" class="text-center text-stone-500 py-10">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="presets.length === 0"
           class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Список пока пуст — добавьте первые аватарки
      </div>

      <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        <div
            v-for="preset in presets"
            :key="preset"
            class="relative"
        >
          <img
              :src="apiUrl(preset)"
              alt=""
              class="w-full aspect-square rounded-full object-cover bg-stone-100 border border-stone-200"
              loading="lazy"
          />
          <button
              type="button"
              class="absolute top-0 right-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow disabled:opacity-60"
              title="Удалить аватарку"
              aria-label="Удалить аватарку"
              :disabled="deleting === preset"
              @click="removePreset(preset)"
          >
            <i :class="deleting === preset ? 'pi pi-spin pi-spinner' : 'pi pi-trash'" class="text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import PrimeButton from 'primevue/button'
import {useToast} from 'primevue/usetoast'
import api from '@/api/client'
import {apiUrl} from '@/api/config'
import {fetchAvatarPresets} from '@/api/avatars.js'

const toast = useToast()

const MAX_AVATAR_SIZE = 10_000_000

const presets = ref([])
const isLoading = ref(false)
const isUploading = ref(false)
const deleting = ref(null)
const fileInput = ref(null)

const errorText = (error) => {
  const data = error.response?.data
  if (typeof data === 'string' && data) return data
  return data?.title || error.message
}

const showError = (error) =>
    toast.add({severity: 'error', summary: 'Ошибка', detail: errorText(error), life: 5000})

const loadPresets = async () => {
  isLoading.value = true
  try {
    presets.value = await fetchAvatarPresets()
  } catch (error) {
    showError(error)
  } finally {
    isLoading.value = false
  }
}

const onFilesSelected = async (event) => {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (files.length === 0) return

  isUploading.value = true
  let uploaded = 0
  try {
    for (const file of files) {
      if (file.size > MAX_AVATAR_SIZE) {
        toast.add({severity: 'warn', summary: `«${file.name}» больше 10 МБ — пропущен`, life: 5000})
        continue
      }
      const data = new FormData()
      data.append('file', file)
      const response = await api.post('/api/avatar/presets', data, {timeout: 60000})
      presets.value.push(response.data)
      uploaded++
    }
    if (uploaded > 0) {
      toast.add({severity: 'success', summary: `Добавлено аватарок: ${uploaded}`, life: 3000})
    }
  } catch (error) {
    showError(error)
  } finally {
    isUploading.value = false
  }
}

const removePreset = async (preset) => {
  if (!window.confirm('Удалить аватарку из списка?\n\nУ пользователей, которые её выбрали, аватарка сбросится.')) return

  const fileName = preset.split('/').pop()
  deleting.value = preset
  try {
    await api.delete(`/api/avatar/presets/${encodeURIComponent(fileName)}`)
    presets.value = presets.value.filter(p => p !== preset)
    toast.add({severity: 'success', summary: 'Аватарка удалена', life: 3000})
  } catch (error) {
    showError(error)
  } finally {
    deleting.value = null
  }
}

onMounted(loadPresets)
</script>
