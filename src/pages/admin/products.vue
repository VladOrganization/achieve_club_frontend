<route lang="yaml">
meta:
  requiresAuth: true
  requiresRoles: ['admin']
</route>

<template>
  <div class="min-h-screen bg-gray-50 py-6 px-4">
    <Toast/>
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Товары</h1>
          <p class="text-gray-600 mt-1">Всего: <span class="font-semibold">{{ products.length }}</span></p>
        </div>
        <div class="flex gap-2">
          <InputText v-model="search" placeholder="Поиск..." class="flex-1 sm:w-56"/>
          <PrimeButton label="Добавить" icon="pi pi-plus" @click="openCreate"/>
        </div>
      </div>

      <div v-if="isLoading" class="text-center text-gray-500 py-10">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="filteredProducts.length === 0"
           class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Товары не найдены
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div class="flex gap-3">
            <img
                v-if="mainPhoto(product)"
                :src="photoUrl(mainPhoto(product))"
                class="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0"
                alt=""
            />
            <div v-else
                 class="w-20 h-20 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
              <i class="pi pi-image text-2xl"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500">{{ product.type }} · {{ product.categoryTitle }}</p>
              <p class="font-semibold text-gray-900 truncate">{{ product.name }}</p>
              <p class="text-blue-600 font-bold">{{ product.price }} XP</p>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span
                v-for="v in product.variants"
                :key="v.id"
                class="text-xs px-2 py-1 rounded-full border"
                :class="v.quantity > 0 ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'"
            >
              {{ v.name }}: {{ v.quantity }} шт.
            </span>
          </div>

          <div class="mt-3 flex gap-2 justify-end">
            <PrimeButton label="Изменить" icon="pi pi-pencil" size="small" severity="secondary"
                         @click="openEdit(product)"/>
            <PrimeButton label="Удалить" icon="pi pi-trash" size="small" severity="danger" outlined
                         @click="removeProduct(product)"/>
          </div>
        </div>
      </div>
    </div>

    <Dialog
        v-model:visible="dialogVisible"
        modal
        :header="form.id ? 'Редактирование товара' : 'Новый товар'"
        :style="{ width: '48rem', maxWidth: '96vw' }"
    >
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-sm text-gray-700">Название
            <InputText v-model="form.name"/>
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-700">Тип
            <InputText v-model="form.type" placeholder="Например: Футболка"/>
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-700">Категория
            <Select v-model="form.categoryId" :options="categories" option-label="title" option-value="id"
                    placeholder="Выберите категорию"/>
          </label>
          <label class="flex flex-col gap-1 text-sm text-gray-700">Цена
            <div class="flex items-center gap-2">
              <InputNumber v-model="form.price" :min="0" :use-grouping="false" class="flex-1"/>
              <span class="text-gray-500 font-medium">XP</span>
            </div>
          </label>
        </div>
        <label class="flex flex-col gap-1 text-sm text-gray-700">Описание
          <Textarea v-model="form.details" rows="3" auto-resize/>
        </label>

        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Варианты</h3>
          <PrimeButton label="Вариант" icon="pi pi-plus" size="small" severity="secondary" @click="addVariant"/>
        </div>

        <div
            v-for="(variant, vi) in form.variants"
            :key="variant.key"
            class="border border-gray-200 rounded-lg p-3 flex flex-col gap-3"
        >
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" :value="vi" v-model="form.defaultVariantIndex"/>
              Вариант по умолчанию
            </label>
            <PrimeButton icon="pi pi-trash" size="small" severity="danger" text
                         :disabled="form.variants.length === 1" @click="removeVariant(vi)"/>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="flex flex-col gap-1 text-sm text-gray-700">Название
              <InputText v-model="variant.name"/>
            </label>
            <label class="flex flex-col gap-1 text-sm text-gray-700">Цвет
              <InputText v-model="variant.color" placeholder="#000000 или название"/>
            </label>
            <label class="flex flex-col gap-1 text-sm text-gray-700">Количество
              <InputNumber v-model="variant.quantity" :min="0" :use-grouping="false"/>
            </label>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-gray-700">Фото (отметьте главное)</span>
            <div class="flex flex-wrap gap-3">
              <div
                  v-for="(photo, pi) in variant.photos"
                  :key="photo"
                  class="relative w-24"
              >
                <img :src="photoUrl(photo)"
                     class="w-24 h-24 rounded-lg object-cover bg-gray-100 border border-gray-200" alt=""/>
                <button
                    type="button"
                    class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
                    title="Удалить фото"
                    @click="removePhoto(variant, pi)"
                >
                  <i class="pi pi-times"></i>
                </button>
                <label class="mt-1 flex items-center justify-center gap-1 text-xs text-gray-600 cursor-pointer">
                  <input type="radio" :value="pi" v-model="variant.defaultPhotoIndex"/>
                  Главное
                </label>
              </div>

              <label
                  class="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 text-xs cursor-pointer hover:border-blue-400 hover:text-blue-500"
                  :class="{ 'opacity-60 pointer-events-none': variant.uploading }"
              >
                <i :class="variant.uploading ? 'pi pi-spin pi-spinner' : 'pi pi-plus'" class="text-xl mb-1"></i>
                {{ variant.uploading ? 'Загрузка...' : 'Добавить' }}
                <input type="file" accept="image/*" multiple class="hidden"
                       @change="onFilesSelected(variant, $event)"/>
              </label>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <PrimeButton label="Отмена" severity="secondary" text @click="dialogVisible = false"/>
        <PrimeButton :label="form.id ? 'Сохранить' : 'Создать'" icon="pi pi-check" :loading="isSaving" @click="save"/>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import PrimeButton from 'primevue/button'
import {useToast} from 'primevue/usetoast'
import api from '@/api/client'

const toast = useToast()

const products = ref([])
const categories = ref([])
const search = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const dialogVisible = ref(false)

let keyCounter = 0
const newVariant = () => ({key: ++keyCounter, id: null, name: '', color: '', quantity: 0, photos: [], defaultPhotoIndex: 0, uploading: false})
const emptyForm = () => ({
  id: null, name: '', type: '', details: '', price: 0, categoryId: null,
  defaultVariantIndex: 0, variants: [newVariant()]
})
const form = ref(emptyForm())

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      (p.categoryTitle || '').toLowerCase().includes(q))
})

const photoUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return `${api.defaults.baseURL}/${url.replace(/^\/+/, '')}`
}

const mainPhoto = (product) => {
  const variant = product.variants.find(v => v.default) || product.variants[0]
  const photo = variant?.photos.find(p => p.default) || variant?.photos[0]
  return photo?.url
}

const errorText = (error) => {
  const data = error.response?.data
  if (typeof data === 'string' && data) return data
  return data?.title || error.message
}

const showError = (error) =>
    toast.add({severity: 'error', summary: 'Ошибка', detail: errorText(error), life: 5000})

const loadProducts = async () => {
  isLoading.value = true
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get('/api/admin/products'),
      api.get('/api/categories')
    ])
    products.value = productsRes.data || []
    categories.value = categoriesRes.data || []
  } catch (error) {
    showError(error)
  } finally {
    isLoading.value = false
  }
}

const openCreate = () => {
  form.value = emptyForm()
  dialogVisible.value = true
}

const openEdit = (product) => {
  form.value = {
    id: product.id,
    name: product.name,
    type: product.type,
    details: product.details,
    price: product.price,
    categoryId: product.categoryId,
    defaultVariantIndex: Math.max(0, product.variants.findIndex(v => v.default)),
    variants: product.variants.map(v => ({
      key: ++keyCounter,
      id: v.id,
      name: v.name,
      color: v.color,
      quantity: v.quantity,
      photos: v.photos.map(p => p.url),
      defaultPhotoIndex: Math.max(0, v.photos.findIndex(p => p.default)),
      uploading: false
    }))
  }
  dialogVisible.value = true
}

const addVariant = () => form.value.variants.push(newVariant())

const removeVariant = (index) => {
  form.value.variants.splice(index, 1)
  if (form.value.defaultVariantIndex >= form.value.variants.length) {
    form.value.defaultVariantIndex = 0
  } else if (form.value.defaultVariantIndex > index) {
    form.value.defaultVariantIndex--
  }
}

const onFilesSelected = async (variant, event) => {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (files.length === 0) return

  variant.uploading = true
  try {
    for (const file of files) {
      const data = new FormData()
      data.append('file', file)
      const response = await api.post('/api/admin/products/photos', data, {timeout: 60000})
      variant.photos.push(response.data)
    }
  } catch (error) {
    showError(error)
  } finally {
    variant.uploading = false
  }
}

const removePhoto = (variant, index) => {
  variant.photos.splice(index, 1)
  if (variant.defaultPhotoIndex >= variant.photos.length) {
    variant.defaultPhotoIndex = 0
  } else if (variant.defaultPhotoIndex > index) {
    variant.defaultPhotoIndex--
  }
}

const validate = () => {
  const f = form.value
  if (!f.name.trim()) return 'Укажите название'
  if (!f.type.trim()) return 'Укажите тип'
  if (!f.categoryId) return 'Выберите категорию'
  if (f.variants.some(v => !v.name.trim())) return 'У каждого варианта должно быть название'
  if (f.variants.some(v => v.uploading)) return 'Дождитесь окончания загрузки фото'
  return null
}

const save = async () => {
  const validationError = validate()
  if (validationError) {
    toast.add({severity: 'warn', summary: validationError, life: 4000})
    return
  }

  const f = form.value
  // пустые поля фото отбрасываем, индекс главного фото пересчитываем
  const variants = f.variants.map(v => {
    const defaultUrl = v.photos[v.defaultPhotoIndex]
    const photos = v.photos.map(p => p.trim()).filter(Boolean)
    const idx = photos.indexOf((defaultUrl || '').trim())
    return {
      id: v.id,
      name: v.name.trim(),
      color: v.color.trim(),
      quantity: v.quantity ?? 0,
      photos,
      defaultPhotoIndex: idx >= 0 ? idx : 0
    }
  })

  const payload = {
    type: f.type.trim(),
    name: f.name.trim(),
    details: f.details || '',
    price: f.price ?? 0,
    categoryId: f.categoryId,
    defaultVariantIndex: f.defaultVariantIndex,
    variants
  }

  isSaving.value = true
  try {
    if (f.id) {
      await api.put(`/api/admin/products/${f.id}`, payload)
    } else {
      await api.post('/api/admin/products', payload)
    }
    dialogVisible.value = false
    toast.add({severity: 'success', summary: 'Сохранено', life: 3000})
    await loadProducts()
  } catch (error) {
    showError(error)
  } finally {
    isSaving.value = false
  }
}

const removeProduct = async (product) => {
  if (!window.confirm(`Удалить товар «${product.name}» вместе со всеми вариантами?`)) return

  try {
    await api.delete(`/api/admin/products/${product.id}`)
    toast.add({severity: 'success', summary: 'Товар удалён', life: 3000})
    await loadProducts()
  } catch (error) {
    showError(error)
  }
}

onMounted(loadProducts)
</script>
