<route lang="yaml">
meta:
  requiresAuth: true
</route>

<template>
  <!-- Для недоступной категории страница ровно во всю высоту экрана (минус нижняя навигация) без прокрутки -->
  <div
      class="py-6 px-4"
      :class="showBanner ? 'h-[calc(100dvh-4rem)] overflow-hidden flex flex-col' : 'min-h-screen'"
  >
    <Toast/>
    <div class="max-w-6xl mx-auto w-full" :class="{ 'flex-1 min-h-0 flex flex-col': showBanner }">
      <!-- Шапка: категория + баланс -->
      <div class="mb-3">
        <h1 class="text-3xl font-bold text-stone-900">Магазин</h1>
        <div class="mt-1 flex items-center gap-2 text-stone-600">
          <i class="pi pi-wallet"></i>
          <span>Баланс:</span>
          <span class="font-bold text-primary-600 text-lg">{{ balance ?? '—' }} XP</span>
        </div>
      </div>

      <!-- Заказы пользователя (только если они есть) -->
      <section v-if="orders.length > 0" class="mb-5">
        <h2 class="text-lg font-semibold text-stone-900 mb-2">
          Мои заказы <span class="text-stone-500 font-normal">({{ orders.length }})</span>
        </h2>

        <div class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
          <div
              v-for="order in orders"
              :key="order.id"
              class="snap-start shrink-0 w-64 bg-white border border-stone-200 rounded-lg p-3 shadow-sm flex gap-3"
          >
            <img v-if="order.photo" :src="photoUrl(order.photo)"
                 class="w-14 h-14 rounded-lg object-cover bg-stone-100 shrink-0" alt=""/>
            <div v-else
                 class="w-14 h-14 rounded-lg bg-stone-100 shrink-0 flex items-center justify-center text-stone-400">
              <i class="pi pi-image"></i>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-semibold text-stone-900 text-sm truncate">{{ order.productTitle }}</p>
              <p class="text-xs text-stone-500 truncate">{{ order.productType }} · {{ order.color }}</p>
              <p class="text-xs text-stone-500">{{ formatDate(order.orderDate) }} · {{ order.price }} XP</p>
              <span
                  class="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  :style="{ backgroundColor: order.deliveryColor || '#78716c' }"
              >{{ order.deliveryStatus }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Категории -->
      <Tabs v-if="categories.length > 1"v-model:value="categoryId" scrollable class="mb-5">
        <TabList>
          <Tab v-for="c in categories" :key="c.id" :value="c.id" class="whitespace-nowrap">
            {{ c.title }}
          </Tab>
        </TabList>
      </Tabs>

      <!-- Недоступная категория: вместо товаров показываем баннер на всю оставшуюся высоту -->
      <div v-if="showBanner" class="flex-1 min-h-0">
        <img v-if="currentCategory.banner" :src="photoUrl(currentCategory.banner)"
             :alt="currentCategory.title" class="w-full h-full rounded-xl object-contain"/>
        <div v-else
             class="h-full flex flex-col items-center justify-center bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500">
          <i class="pi pi-lock text-3xl mb-2"></i>
          <p>Категория «{{ currentCategory.title }}» пока недоступна</p>
        </div>
      </div>

      <div v-else-if="isLoading" class="text-center text-stone-500 py-16">
        <i class="pi pi-spin pi-spinner text-3xl"></i>
      </div>

      <div v-else-if="products.length === 0"
           class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        В этой категории пока нет товаров
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
            v-for="product in products"
            :key="product.id"
            class="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden flex flex-col"
        >
          <button type="button" class="block aspect-square bg-stone-100 w-full" @click="openProduct(product)">
            <img v-if="cardPhoto(product)" :src="photoUrl(cardPhoto(product))"
                 class="w-full h-full object-cover" :alt="product.title"/>
            <span v-else class="w-full h-full flex items-center justify-center text-stone-400">
              <i class="pi pi-image text-4xl"></i>
            </span>
          </button>

          <div class="p-3 flex flex-col gap-2 flex-1">
            <div class="min-w-0">
              <p class="font-semibold text-stone-900 truncate">{{ product.title }}</p>
              <p class="text-xs text-stone-500 truncate">{{ product.type }}</p>
            </div>

            <div v-if="product.variants.length > 1" class="flex flex-wrap gap-1.5">
              <span
                  v-for="v in product.variants"
                  :key="v.id"
                  class="w-5 h-5 rounded-full border border-stone-300"
                  :class="{ 'opacity-30': !v.available }"
                  :style="{ backgroundColor: cssColor(v.color) }"
                  :title="v.available ? v.color : `${v.color} — нет в наличии`"
              ></span>
            </div>

            <Button
                class="mt-auto w-full"
                size="small"
                icon="pi pi-shopping-cart"
                :label="buttonLabel(product)"
                :disabled="cardDisabled(product)"
                @click="openProduct(product)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно товара -->
    <Dialog
        v-model:visible="dialogVisible"
        modal
        dismissable-mask
        :style="{ width: '44rem', maxWidth: '96vw' }"
        :pt="{ header: { class: '!py-3' }, content: { class: '!pt-0' } }"
        @hide="resetDialog"
    >
      <template #header>
        <div class="min-w-0 pr-2">
          <p class="text-base font-semibold text-stone-900 leading-tight line-clamp-2">
            {{ details?.title || selectedProduct?.title }}
          </p>
          <p class="text-xs text-stone-500 mt-0.5 truncate">
            {{ details?.type || selectedProduct?.type }}
          </p>
        </div>
      </template>
      <div v-if="isDetailsLoading" class="text-center text-stone-500 py-16">
        <i class="pi pi-spin pi-spinner text-3xl"></i>
      </div>

      <div v-else-if="details" class="flex flex-col gap-4">
        <!-- Карусель фото выбранного цвета -->
        <div v-if="galleryPhotos.length > 0" class="flex flex-col gap-2">
          <div class="relative bg-stone-100 rounded-lg overflow-hidden select-none"
               @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
            <img :src="photoUrl(galleryPhotos[photoIndex].url)" :alt="details.title"
                 class="w-full h-72 sm:h-96 object-contain"/>

            <template v-if="galleryPhotos.length > 1">
              <button type="button"
                      class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center"
                      @click="prevPhoto">
                <i class="pi pi-chevron-left"></i>
              </button>
              <button type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center"
                      @click="nextPhoto">
                <i class="pi pi-chevron-right"></i>
              </button>
              <span class="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full bg-black/50 text-white">
                {{ photoIndex + 1 }} / {{ galleryPhotos.length }}
              </span>
            </template>
          </div>

          <div v-if="galleryPhotos.length > 1" class="flex gap-2 overflow-x-auto pb-1">
            <button
                v-for="(photo, i) in galleryPhotos"
                :key="photo.url"
                type="button"
                class="shrink-0 w-16 h-16 rounded-md overflow-hidden border-2"
                :class="i === photoIndex ? 'border-primary-600' : 'border-transparent opacity-70'"
                @click="photoIndex = i"
            >
              <img :src="photoUrl(photo.url)" alt="" class="w-full h-full object-cover"/>
            </button>
          </div>
        </div>
        <div v-else
             class="h-48 rounded-lg bg-stone-100 flex flex-col items-center justify-center text-stone-400">
          <i class="pi pi-image text-5xl"></i>
          <span class="text-sm mt-2">Нет фото</span>
        </div>

        <!-- Выбор цвета -->
        <div v-if="details.variants.length > 1" class="flex flex-col gap-2">
          <p class="text-sm text-stone-700">
            Цвет: <span class="font-semibold">{{ selectedVariant.title }}</span>
          </p>
          <div class="flex flex-wrap gap-3">
            <button
                v-for="v in details.variants"
                :key="v.id"
                type="button"
                class="relative w-10 h-10 rounded-full border-2 transition"
                :class="v.id === selectedVariantId ? 'border-primary-600 ring-2 ring-primary-200' : 'border-stone-300'"
                :style="{ backgroundColor: cssColor(v.color) }"
                :title="v.available ? v.title : `${v.title} — нет в наличии`"
                @click="selectedVariantId = v.id"
            >
              <span v-if="!v.available"
                    class="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center text-red-500">
                <i class="pi pi-times"></i>
              </span>
            </button>
          </div>
        </div>

        <div v-if="details.details" class="text-sm text-stone-700 whitespace-pre-line">
          {{ details.details }}
        </div>
      </div>

      <template #footer>
        <div class="w-full flex items-center justify-between gap-3">
          <span class="text-2xl font-bold text-primary-600">{{ details?.price ?? selectedProduct?.price }} XP</span>
          <Button
              class="flex-1 sm:flex-none sm:min-w-56"
              icon="pi pi-shopping-cart"
              :label="dialogBuyLabel"
              :disabled="dialogBuyDisabled"
              :loading="isBuying"
              @click="buy"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useToast} from 'primevue/usetoast'
import api from '@/api/client'

const toast = useToast()

const categories = ref([])
const categoryId = ref(null)
const products = ref([])
const orders = ref([])
const balance = ref(null)
const isLoading = ref(false)

const dialogVisible = ref(false)
const selectedProduct = ref(null)
const details = ref(null)
const isDetailsLoading = ref(false)
const selectedVariantId = ref(null)
const isBuying = ref(false)

const currentCategory = computed(() => categories.value.find(c => c.id === categoryId.value))

const showBanner = computed(() => !!currentCategory.value && !currentCategory.value.available)

const selectedVariant = computed(() =>
    details.value?.variants.find(v => v.id === selectedVariantId.value) || null)

// главное фото первым; если у варианта нет списка фото - берём фото из карточки
const galleryPhotos = computed(() => {
  const variant = selectedVariant.value
  if (!variant) return []

  const photos = [...(variant.photos || [])].sort((a, b) => Number(b.default) - Number(a.default))
  if (photos.length > 0) return photos

  const fallback = selectedProduct.value?.variants.find(v => v.id === variant.id)?.photo
  return fallback ? [{default: true, url: fallback}] : []
})

const photoIndex = ref(0)
watch(selectedVariantId, () => {
  photoIndex.value = 0
})

const nextPhoto = () => {
  photoIndex.value = (photoIndex.value + 1) % galleryPhotos.value.length
}

const prevPhoto = () => {
  photoIndex.value = (photoIndex.value - 1 + galleryPhotos.value.length) % galleryPhotos.value.length
}

let touchStartX = null
const onTouchStart = (e) => {
  touchStartX = e.changedTouches[0].clientX
}
const onTouchEnd = (e) => {
  if (touchStartX === null || galleryPhotos.value.length < 2) return
  const delta = e.changedTouches[0].clientX - touchStartX
  touchStartX = null
  if (Math.abs(delta) < 40) return
  delta < 0 ? nextPhoto() : prevPhoto()
}

const canAfford = (price) => balance.value !== null && balance.value >= price

const inStock = (product) => product.variants.some(v => v.available)

const cardDisabled = (product) => !inStock(product) || !canAfford(product.price)

const buttonLabel = (product) => {
  if (!inStock(product)) return 'Нет в наличии'
  return `Купить · ${product.price} XP`
}

const dialogBuyDisabled = computed(() => {
  if (!details.value || !selectedVariant.value) return true
  return !selectedVariant.value.available || !canAfford(details.value.price)
})

const dialogBuyLabel = computed(() => {
  if (!details.value || !selectedVariant.value) return 'Купить'
  if (!selectedVariant.value.available) return 'Нет в наличии'
  if (!canAfford(details.value.price)) return 'Недостаточно средств'
  return `Купить · ${details.value.price} XP`
})

// цвет может храниться как hex без '#' (например "ffffff") - CSS такое значение игнорирует
const cssColor = (color) => {
  const value = (color || '').trim()
  return /^([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ? `#${value}` : value
}

const photoUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return `${api.defaults.baseURL}/${url.replace(/^\/+/, '')}`
}

const cardPhoto = (product) => {
  const variant = product.variants.find(v => v.default) || product.variants[0]
  return variant?.photo
}

const formatDate = (date) => new Date(date).toLocaleDateString('ru-RU', {
  day: '2-digit', month: '2-digit', year: 'numeric'
})

const showError = (error) => {
  const data = error.response?.data
  toast.add({
    severity: 'error',
    summary: 'Ошибка',
    detail: (typeof data === 'string' && data) || data?.title || error.message,
    life: 5000
  })
}

const loadBalance = async () => {
  const response = await api.get('/api/balance')
  balance.value = response.data
}

const loadOrders = async () => {
  const response = await api.get('/api/orders')
  orders.value = [...(response.data || [])].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
}

const loadProducts = async () => {
  if (categoryId.value === null || currentCategory.value?.available === false) {
    products.value = []
    return
  }
  isLoading.value = true
  try {
    const response = await api.get('/api/products', {params: {categoryId: categoryId.value}})
    products.value = response.data || []
  } catch (error) {
    products.value = []
    showError(error)
  } finally {
    isLoading.value = false
  }
}

// Категория по умолчанию: доступная без ограничения по датам, иначе любая доступная, иначе первая
const pickDefaultCategory = () => {
  const list = categories.value
  const permanent = list.find(c => c.available && !c.startDate && !c.endDate)
  return (permanent || list.find(c => c.available) || list[0])?.id ?? null
}

const openProduct = async (product) => {
  selectedProduct.value = product
  details.value = null
  dialogVisible.value = true
  isDetailsLoading.value = true
  try {
    const response = await api.get(`/api/products/${product.id}`)
    details.value = response.data
    const preferred = details.value.variants.find(v => v.default && v.available)
        || details.value.variants.find(v => v.available)
        || details.value.variants.find(v => v.default)
        || details.value.variants[0]
    selectedVariantId.value = preferred?.id ?? null
  } catch (error) {
    dialogVisible.value = false
    showError(error)
  } finally {
    isDetailsLoading.value = false
  }
}

const resetDialog = () => {
  selectedProduct.value = null
  details.value = null
  selectedVariantId.value = null
}

const buy = async () => {
  if (dialogBuyDisabled.value) return

  isBuying.value = true
  try {
    await api.post('/api/orders', {
      productId: details.value.id,
      variantId: selectedVariantId.value
    })
    toast.add({severity: 'success', summary: 'Заказ оформлен', detail: details.value.title, life: 4000})
    dialogVisible.value = false
    await Promise.all([loadBalance(), loadOrders(), loadProducts()])
  } catch (error) {
    showError(error)
    // остатки и баланс могли измениться
    await Promise.allSettled([loadBalance(), loadProducts()])
  } finally {
    isBuying.value = false
  }
}

watch(categoryId, loadProducts)

onMounted(async () => {
  try {
    const [categoriesRes] = await Promise.all([
      api.get('/api/categories'),
      loadBalance(),
      loadOrders()
    ])
    categories.value = categoriesRes.data || []
    categoryId.value = pickDefaultCategory()
  } catch (error) {
    showError(error)
  }
})
</script>
