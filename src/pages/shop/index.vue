<route lang="yaml">
meta:
  requiresAuth: true
</route>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Магазин</h1>
          <p class="text-gray-600 mt-1">Обменивайте XP на товары клуба</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
            <p class="text-gray-600 text-xs font-medium">Баланс</p>
            <p class="text-2xl font-bold text-indigo-600">{{ formatXp(balance) }}</p>
          </div>
          <Button
              icon="pi pi-info-circle"
              severity="secondary"
              rounded
              text
              aria-label="О магазине"
              @click="showInfo = true"
          />
        </div>
      </div>

      <Skeleton v-if="isLoading" height="400px" />

      <Message
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mb-6 rounded-lg"
          @close="errorMessage = ''"
      />

      <template v-if="!isLoading">
        <div v-if="categories.length" class="flex flex-wrap gap-3 mb-6">
          <Button
              v-for="category in categories"
              :key="category.id"
              :label="category.title"
              :severity="selectedCategoryId === category.id ? 'primary' : 'secondary'"
              text
              @click="selectCategory(category.id)"
              :pt="{
                root: {
                  class: selectedCategoryId === category.id
                    ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              }"
          />
        </div>

        <div
            v-if="latestOrder"
            class="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center gap-4"
        >
          <div class="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            <img
                v-if="latestOrder.photo && orderImageLoaded"
                :src="mediaUrl(latestOrder.photo)"
                :alt="latestOrder.productTitle"
                class="max-h-full max-w-full object-contain"
                @error="orderImageLoaded = false"
            />
            <i v-else class="pi pi-box text-2xl text-gray-300"></i>
          </div>
          <div class="min-w-0">
            <p class="font-bold text-gray-900">{{ latestOrder.deliveryStatus }}</p>
            <p class="text-gray-600 text-sm">
              {{ latestOrder.productType }} {{ latestOrder.productTitle }}
            </p>
            <p class="text-indigo-600 text-sm font-medium mt-1">
              Заказ от {{ formatDate(latestOrder.orderDate) }}
            </p>
          </div>
        </div>

        <div
            v-if="selectedCategory && !selectedCategory.available"
            class="bg-white rounded-lg shadow-md p-12 text-center"
        >
          <i class="pi pi-clock text-5xl text-gray-300 mb-4"></i>
          <p class="text-gray-700 text-lg">
            {{ selectedCategory.title }} будет доступен
            <template v-if="selectedCategory.startDate && selectedCategory.endDate">
              с {{ formatDate(selectedCategory.startDate) }} до {{ formatDate(selectedCategory.endDate) }}
            </template>
            <template v-else>
              позже
            </template>
          </p>
        </div>

        <template v-else-if="selectedCategory">
          <div
              v-if="selectedCategory.banner"
              class="bg-white rounded-lg shadow-md overflow-hidden mb-6 h-40"
          >
            <img
                :src="mediaUrl(selectedCategory.banner)"
                :alt="selectedCategory.title"
                class="w-full h-full object-cover"
            />
          </div>

          <div v-if="isProductsLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Skeleton v-for="n in 4" :key="n" height="320px" />
          </div>

          <div
              v-else-if="products.length === 0"
              class="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <i class="pi pi-inbox text-5xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">В этой категории пока нет товаров</p>
          </div>

          <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <ProductCard
                v-for="product in products"
                :key="product.id"
                :product="product"
                @open="openProduct(product.id)"
            />
          </div>
        </template>

        <div
            v-else
            class="bg-white rounded-lg shadow-md p-12 text-center"
        >
          <i class="pi pi-shopping-bag text-5xl text-gray-300 mb-4"></i>
          <p class="text-gray-500 text-lg">Категории магазина пока не настроены</p>
        </div>
      </template>
    </div>

    <Dialog
        v-model:visible="showInfo"
        header="О магазине"
        :modal="true"
        :draggable="false"
        class="w-full max-w-md"
        :pt="{
          header: { class: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0 rounded-t-xl' },
          title: { class: 'text-white font-bold' }
        }"
    >
      <p class="text-gray-700 mt-2">
        XP начисляются за выполненные достижения. Их можно потратить на товары клуба.
        После заказа статус доставки появится на этой странице. Когда товар заберут, заказ уйдёт в историю в профиле.
      </p>
    </Dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import ProductCard from '@/components/shop/ProductCard.vue'
import api from '@/api/client'
import { formatDate, formatXp, isActiveOrderStatus, mediaUrl, pickDefaultCategory, sortCategories } from '@/utils/media'

const router = useRouter()

const isLoading = ref(false)
const isProductsLoading = ref(false)
const errorMessage = ref('')
const showInfo = ref(false)
const balance = ref(0)
const categories = ref([])
const products = ref([])
const orders = ref([])
const selectedCategoryId = ref(null)
const orderImageLoaded = ref(true)

const selectedCategory = computed(() =>
    categories.value.find((c) => c.id === selectedCategoryId.value) || null
)

const latestOrder = computed(() => {
  const active = orders.value.filter((o) => isActiveOrderStatus(o.deliveryStatus))
  if (!active.length) return null
  return [...active].sort(
      (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
  )[0]
})

const loadBalance = async () => {
  const { data } = await api.get('/api/balance')
  balance.value = typeof data === 'number' ? data : Number(data) || 0
}

const loadCategories = async () => {
  const { data } = await api.get('/api/categories')
  categories.value = sortCategories(data || [])
  if (categories.value.length && selectedCategoryId.value == null) {
    selectedCategoryId.value = pickDefaultCategory(categories.value)?.id ?? categories.value[0].id
  }
}

const loadOrders = async () => {
  try {
    const { data } = await api.get('/api/orders')
    orders.value = data || []
    orderImageLoaded.value = true
  } catch {
    orders.value = []
  }
}

const loadProducts = async (categoryId) => {
  if (!categoryId) {
    products.value = []
    return
  }

  const category = categories.value.find((c) => c.id === categoryId)
  if (category && !category.available) {
    products.value = []
    return
  }

  isProductsLoading.value = true
  try {
    const { data } = await api.get('/api/products', { params: { categoryId } })
    products.value = data || []
  } catch (error) {
    products.value = []
    errorMessage.value = error.response?.data || error.message || 'Не удалось загрузить товары'
  } finally {
    isProductsLoading.value = false
  }
}

const selectCategory = async (categoryId) => {
  selectedCategoryId.value = categoryId
  errorMessage.value = ''
  await loadProducts(categoryId)
}

const openProduct = (productId) => {
  router.push(`/shop/${productId}`)
}

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await Promise.all([loadBalance(), loadCategories(), loadOrders()])
    if (selectedCategoryId.value) {
      await loadProducts(selectedCategoryId.value)
    }
  } catch (error) {
    errorMessage.value = error.response?.data || error.message || 'Ошибка при загрузке магазина'
  } finally {
    isLoading.value = false
  }
})
</script>
