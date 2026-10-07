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
          <h1 class="text-3xl font-bold text-stone-900">Товары</h1>
          <p class="text-stone-600 mt-1">Всего: <span class="font-semibold">{{ products.length }}</span></p>
        </div>
        <div class="flex gap-2">
          <InputText v-model="search" placeholder="Поиск..." class="flex-1 sm:w-56"/>
          <PrimeButton label="Добавить" icon="pi pi-plus" @click="openCreate"/>
        </div>
      </div>

      <div v-if="isLoading" class="text-center text-stone-500 py-10">
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
            class="bg-white border border-stone-200 rounded-lg p-4 shadow-sm"
        >
          <div class="flex gap-3">
            <img
                v-if="mainPhoto(product)"
                :src="photoUrl(mainPhoto(product))"
                class="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0"
                alt=""
            />
            <div v-else
                 class="w-20 h-20 rounded-lg bg-stone-100 shrink-0 flex items-center justify-center text-stone-400">
              <i class="pi pi-image text-2xl"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-stone-500">{{ product.type }} · {{ product.categoryTitle }}</p>
              <p class="font-semibold text-stone-900 truncate">{{ product.name }}</p>
              <p class="text-primary-600 font-bold">{{ product.price }} XP</p>
            </div>

            <!-- Действия в шапке карточки -->
            <div class="flex shrink-0 gap-1 self-start -mt-1 -mr-1">
              <PrimeButton icon="pi pi-pencil" text rounded aria-label="Изменить" title="Изменить"
                           @click="openEdit(product)"/>
              <PrimeButton icon="pi pi-trash" severity="danger" text rounded aria-label="Удалить" title="Удалить"
                           @click="removeProduct(product)"/>
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
        </div>
      </div>

      <!-- Категории -->
      <div class="mt-10 pt-6 border-t border-stone-200">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-2xl font-bold text-stone-900">Категории</h2>
            <p class="text-stone-600 mt-1">Всего: <span class="font-semibold">{{ categories.length }}</span></p>
          </div>
          <PrimeButton label="Добавить" icon="pi pi-plus" @click="openCategoryCreate"/>
        </div>

        <div v-if="!isLoading && categories.length === 0"
             class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Категорий пока нет
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
              v-for="category in categories"
              :key="category.id"
              class="bg-white border border-stone-200 rounded-lg p-4 shadow-sm"
          >
            <div class="flex gap-3">
              <div class="w-20 h-14 rounded-lg bg-stone-100 shrink-0 overflow-hidden flex items-center justify-center text-stone-400">
                <img v-if="category.availableBanner" :src="photoUrl(category.availableBanner)"
                     class="w-full h-full object-cover" alt=""/>
                <i v-else class="pi pi-image text-xl"></i>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-stone-900 truncate flex items-center gap-2">
                  <span v-if="category.color" class="inline-block w-3 h-3 rounded-full border border-stone-300 shrink-0"
                        :style="{ backgroundColor: '#' + normalizeColor(category.color) }"></span>
                  {{ category.title }}
                </p>
                <p class="text-xs text-stone-500">
                  Товаров: {{ category.productsCount }} · {{ formatPeriod(category) }}
                </p>
                <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full border"
                      :class="category.show ? 'border-green-300 bg-green-50 text-green-700' : 'border-stone-300 bg-stone-50 text-stone-600'">
                  {{ category.show ? 'Показывается' : 'Скрыта' }}
                </span>
              </div>
              <div class="flex shrink-0 gap-1 self-start -mt-1 -mr-1">
                <PrimeButton icon="pi pi-pencil" text rounded aria-label="Изменить" title="Изменить"
                             @click="openCategoryEdit(category)"/>
                <PrimeButton icon="pi pi-trash" severity="danger" text rounded aria-label="Удалить" title="Удалить"
                             @click="removeCategory(category)"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Dialog
        v-model:visible="categoryDialogVisible"
        modal
        :header="categoryForm.id ? 'Редактирование категории' : 'Новая категория'"
        :style="{ width: '40rem', maxWidth: '96vw' }"
    >
      <div class="flex flex-col gap-4">
        <label class="flex flex-col gap-1 text-sm text-stone-700">Название
          <InputText v-model="categoryForm.title"/>
        </label>

        <div class="flex flex-col gap-1 text-sm text-stone-700">
          Цвет
          <div class="flex items-center gap-3 h-[2.5rem]">
            <ColorPicker
                :model-value="normalizeColor(categoryForm.color)"
                format="hex"
                @update:model-value="categoryForm.color = normalizeColor($event)"
            />
            <span v-if="categoryForm.color" class="font-mono text-stone-600 uppercase">#{{ normalizeColor(categoryForm.color) }}</span>
            <span v-else class="text-stone-400">не задан</span>
            <PrimeButton v-if="categoryForm.color" label="Сбросить" size="small" severity="secondary" text
                         @click="categoryForm.color = null"/>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-sm text-stone-700">Начало
            <DatePicker v-model="categoryForm.startDate" show-time hour-format="24" show-button-bar date-format="dd.mm.yy"/>
          </label>
          <label class="flex flex-col gap-1 text-sm text-stone-700">Конец
            <DatePicker v-model="categoryForm.endDate" show-time hour-format="24" show-button-bar date-format="dd.mm.yy"/>
          </label>
        </div>
        <p class="text-xs text-stone-500 -mt-2">
          Если не указана хотя бы одна из дат, ограничения по времени нет.
        </p>

        <label class="flex items-center gap-3 text-sm text-stone-700 cursor-pointer">
          <ToggleSwitch v-model="categoryForm.show"/>
          Показывать категорию в магазине
        </label>

        <div v-for="slot in bannerSlots" :key="slot.field" class="flex flex-col gap-2">
          <span class="text-sm text-stone-700">{{ slot.label }}</span>
          <div class="flex items-center gap-3">
            <div class="relative">
              <img v-if="categoryForm[slot.field]" :src="photoUrl(categoryForm[slot.field])"
                   class="h-24 max-w-[16rem] rounded-lg object-contain bg-stone-100 border border-stone-200" alt=""/>
              <div v-else
                   class="h-24 w-40 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                <i class="pi pi-image text-2xl"></i>
              </div>
              <button
                  v-if="categoryForm[slot.field]"
                  type="button"
                  class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
                  title="Убрать баннер"
                  @click="categoryForm[slot.field] = null"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>
            <label
                class="px-3 py-2 rounded-lg border-2 border-dashed border-stone-300 flex items-center gap-2 text-stone-500 text-sm cursor-pointer hover:border-primary-400 hover:text-primary-500"
                :class="{ 'opacity-60 pointer-events-none': categoryForm.uploading === slot.field }"
            >
              <i :class="categoryForm.uploading === slot.field ? 'pi pi-spin pi-spinner' : 'pi pi-upload'"></i>
              {{ categoryForm.uploading === slot.field ? 'Загрузка...' : 'Загрузить' }}
              <input type="file" accept="image/*" class="hidden" @change="onBannerSelected(slot.field, $event)"/>
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <PrimeButton label="Отмена" severity="secondary" text @click="categoryDialogVisible = false"/>
        <PrimeButton :label="categoryForm.id ? 'Сохранить' : 'Создать'" icon="pi pi-check"
                     :loading="isCategorySaving" @click="saveCategory"/>
      </template>
    </Dialog>

    <Dialog
        v-model:visible="dialogVisible"
        modal
        :header="form.id ? 'Редактирование товара' : 'Новый товар'"
        :style="{ width: '48rem', maxWidth: '96vw' }"
    >
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="flex flex-col gap-1 text-sm text-stone-700">Название
            <InputText v-model="form.name"/>
          </label>
          <label class="flex flex-col gap-1 text-sm text-stone-700">Тип
            <InputText v-model="form.type" placeholder="Например: Футболка"/>
          </label>
          <label class="flex flex-col gap-1 text-sm text-stone-700">Категория
            <Select v-model="form.categoryId" :options="categories" option-label="title" option-value="id"
                    placeholder="Выберите категорию"/>
          </label>
          <label class="flex flex-col gap-1 text-sm text-stone-700">Цена
            <div class="flex items-center gap-2">
              <InputNumber v-model="form.price" :min="0" :use-grouping="false" class="flex-1"/>
              <span class="text-stone-500 font-medium">XP</span>
            </div>
          </label>
        </div>
        <label class="flex flex-col gap-1 text-sm text-stone-700">Описание
          <Textarea v-model="form.details" rows="3" auto-resize/>
        </label>

        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-stone-900">Варианты</h3>
          <PrimeButton label="Вариант" icon="pi pi-plus" size="small" severity="secondary" @click="addVariant"/>
        </div>

        <div
            v-for="(variant, vi) in form.variants"
            :key="variant.key"
            class="border border-stone-200 rounded-lg p-3 flex flex-col gap-3"
        >
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input type="radio" :value="vi" v-model="form.defaultVariantIndex"/>
              Вариант по умолчанию
            </label>
            <PrimeButton icon="pi pi-trash" size="small" severity="danger" text
                         :disabled="form.variants.length === 1" @click="removeVariant(vi)"/>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="flex flex-col gap-1 text-sm text-stone-700">Название
              <InputText v-model="variant.name"/>
            </label>
            <div class="flex flex-col gap-1 text-sm text-stone-700">
              Цвет
              <div class="flex items-center gap-3 h-[2.5rem]">
                <ColorPicker
                    :model-value="pickerValue(variant.color)"
                    format="hex"
                    @update:model-value="setVariantColor(variant, $event)"
                />
                <span class="font-mono text-stone-600 uppercase">#{{ normalizeColor(variant.color) }}</span>
              </div>
            </div>
            <label class="flex flex-col gap-1 text-sm text-stone-700">Количество
              <InputNumber v-model="variant.quantity" :min="0" :use-grouping="false"/>
            </label>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm text-stone-700">Фото (отметьте главное)</span>
            <div class="flex flex-wrap gap-3">
              <div
                  v-for="(photo, pi) in variant.photos"
                  :key="photo"
                  class="relative w-24"
              >
                <img :src="photoUrl(photo)"
                     class="w-24 h-24 rounded-lg object-cover bg-stone-100 border border-stone-200" alt=""/>
                <button
                    type="button"
                    class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
                    title="Удалить фото"
                    @click="removePhoto(variant, pi)"
                >
                  <i class="pi pi-times"></i>
                </button>
                <label class="mt-1 flex items-center justify-center gap-1 text-xs text-stone-600 cursor-pointer">
                  <input type="radio" :value="pi" v-model="variant.defaultPhotoIndex"/>
                  Главное
                </label>
              </div>

              <label
                  class="w-24 h-24 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-500 text-xs cursor-pointer hover:border-primary-400 hover:text-primary-500"
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
import DatePicker from 'primevue/datepicker'
import ToggleSwitch from 'primevue/toggleswitch'
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
// Бекенд хранит цвет варианта как есть (строка без проверки формата), а в данных принят hex БЕЗ '#' (например "ffffff"):
// так же устроены цвета тегов (varchar(8)) и примеры запросов, а магазин при показе сам добавляет '#' (cssColor).
// Поэтому в бекенд всегда отправляем шесть hex-символов без '#'.
const DEFAULT_COLOR = '000000' // цвет варианта по умолчанию — чёрный

// Любое сохранённое значение цвета (#fff, ffffff, название вроде "red") приводим к виду rrggbb
const normalizeColor = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return DEFAULT_COLOR
  const hex = raw.replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(hex)) return hex.split('').map(c => c + c).join('').toLowerCase()
  if (/^[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase()
  if (/^[0-9a-f]{8}$/i.test(hex)) return hex.slice(0, 6).toLowerCase() // прозрачность отбрасываем
  // название цвета: пусть браузер сам переведёт его в hex
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillStyle = '#000000'
  ctx.fillStyle = raw
  const resolved = ctx.fillStyle
  return /^#[0-9a-f]{6}$/i.test(resolved) ? resolved.slice(1).toLowerCase() : DEFAULT_COLOR
}

// ColorPicker тоже работает с hex без '#', так что значение передаётся как есть
const pickerValue = (color) => normalizeColor(color)
const setVariantColor = (variant, value) => {
  variant.color = normalizeColor(value)
}

const newVariant = () => ({key: ++keyCounter, id: null, name: '', color: DEFAULT_COLOR, quantity: 0, photos: [], defaultPhotoIndex: 0, uploading: false})
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
      api.get('/api/categories/all')
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
      color: normalizeColor(v.color),
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
      color: normalizeColor(v.color),
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

// ---- Категории ----
const categoryDialogVisible = ref(false)
const isCategorySaving = ref(false)
const bannerSlots = [
  {field: 'availableBanner', label: 'Баннер, когда категория доступна'},
  {field: 'unavailableBanner', label: 'Баннер, когда категория недоступна'}
]
const emptyCategoryForm = () => ({
  id: null, title: '', color: null, startDate: null, endDate: null,
  availableBanner: null, unavailableBanner: null, show: true, uploading: null
})
const categoryForm = ref(emptyCategoryForm())

const formatDate = (value) => new Date(value).toLocaleDateString('ru-RU')
const formatPeriod = (category) => {
  if (!category.startDate || !category.endDate) return 'без ограничения по времени'
  return `${formatDate(category.startDate)} — ${formatDate(category.endDate)}`
}

// Бекенд хранит даты как "timestamp without time zone" и сравнивает с локальным временем сервера,
// поэтому отправляем локальное время без часового пояса (без 'Z')
const pad = (n) => String(n).padStart(2, '0')
const toLocalIso = (date) => date
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    : null

const openCategoryCreate = () => {
  categoryForm.value = emptyCategoryForm()
  categoryDialogVisible.value = true
}

const openCategoryEdit = (category) => {
  categoryForm.value = {
    id: category.id,
    title: category.title,
    color: category.color ? normalizeColor(category.color) : null,
    startDate: category.startDate ? new Date(category.startDate) : null,
    endDate: category.endDate ? new Date(category.endDate) : null,
    availableBanner: category.availableBanner,
    unavailableBanner: category.unavailableBanner,
    show: category.show,
    uploading: null
  }
  categoryDialogVisible.value = true
}

const onBannerSelected = async (field, event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  categoryForm.value.uploading = field
  try {
    const data = new FormData()
    data.append('file', file)
    const response = await api.post('/api/categories/banners', data, {timeout: 60000})
    categoryForm.value[field] = response.data
  } catch (error) {
    showError(error)
  } finally {
    categoryForm.value.uploading = null
  }
}

const saveCategory = async () => {
  const f = categoryForm.value
  if (!f.title.trim()) {
    toast.add({severity: 'warn', summary: 'Укажите название', life: 4000})
    return
  }
  if (f.uploading) {
    toast.add({severity: 'warn', summary: 'Дождитесь окончания загрузки баннера', life: 4000})
    return
  }
  if (f.startDate && f.endDate && f.startDate > f.endDate) {
    toast.add({severity: 'warn', summary: 'Начало не может быть позже конца', life: 4000})
    return
  }

  const payload = {
    title: f.title.trim(),
    color: f.color,
    startDate: toLocalIso(f.startDate),
    endDate: toLocalIso(f.endDate),
    availableBanner: f.availableBanner,
    unavailableBanner: f.unavailableBanner,
    show: f.show
  }

  isCategorySaving.value = true
  try {
    if (f.id) {
      await api.put(`/api/categories/${f.id}`, payload)
    } else {
      await api.post('/api/categories', payload)
    }
    categoryDialogVisible.value = false
    toast.add({severity: 'success', summary: 'Сохранено', life: 3000})
    await loadProducts()
  } catch (error) {
    showError(error)
  } finally {
    isCategorySaving.value = false
  }
}

const removeCategory = async (category) => {
  const warning = category.productsCount > 0
      ? `\n\nВместе с ней будут удалены товары категории (${category.productsCount} шт.) и их варианты.`
      : ''
  if (!window.confirm(`Удалить категорию «${category.title}»?${warning}`)) return

  try {
    await api.delete(`/api/categories/${category.id}`)
    toast.add({severity: 'success', summary: 'Категория удалена', life: 3000})
    await loadProducts()
  } catch (error) {
    showError(error)
  }
}

onMounted(loadProducts)
</script>
