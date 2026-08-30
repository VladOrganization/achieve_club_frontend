<route lang="yaml">
meta:
  requiresAuth: true
</route>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="flex items-center justify-between gap-4 mb-6">
        <Button
            icon="pi pi-arrow-left"
            label="К магазину"
            severity="secondary"
            text
            @click="router.push('/shop')"
        />
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
          <p class="text-sm font-bold text-indigo-600">Баланс: {{ formatXp(balance) }}</p>
        </div>
      </div>

      <Skeleton v-if="isLoading" height="520px" />

      <Message
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mb-6 rounded-lg"
          @close="errorMessage = ''"
      />

      <div v-if="!isLoading && product" class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div class="bg-gray-50 p-6 flex flex-col items-center justify-center min-h-[360px]">
            <div class="w-full max-w-sm aspect-square bg-white rounded-2xl flex items-center justify-center overflow-hidden relative">
              <img
                  v-if="currentPhoto && imageLoaded"
                  :src="mediaUrl(currentPhoto)"
                  :alt="product.title"
                  class="max-h-full max-w-full object-contain"
                  @error="imageLoaded = false"
              />
              <i v-else class="pi pi-image text-6xl text-gray-300"></i>
              <span
                  v-if="photos.length > 1"
                  class="absolute bottom-3 left-3 bg-white/90 text-gray-800 text-xs font-medium px-2 py-1 rounded-full border border-gray-200"
              >
                {{ photoIndex + 1 }}/{{ photos.length }}
              </span>
            </div>
            <div v-if="photos.length > 1" class="flex gap-2 mt-4">
              <button
                  v-for="(photo, index) in photos"
                  :key="`${photo.url}-${index}`"
                  class="w-14 h-14 rounded-lg overflow-hidden border-2 bg-white"
                  :class="index === photoIndex ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'"
                  @click="photoIndex = index"
              >
                <img :src="mediaUrl(photo.url)" alt="" class="w-full h-full object-contain" />
              </button>
            </div>
          </div>

          <div class="p-6 md:p-8 flex flex-col">
            <div v-if="product.variants?.length" class="flex flex-wrap gap-2 mb-5">
              <button
                  v-for="variant in product.variants"
                  :key="variant.id"
                  class="w-10 h-10 rounded-lg border-2 transition-shadow"
                  :class="[
                    variant.id === selectedVariantId ? 'border-indigo-500 shadow-md' : 'border-gray-200',
                    !variant.available ? 'opacity-40' : ''
                  ]"
                  :style="{ backgroundColor: isCssColor(variant.color) ? variant.color : '#e5e7eb' }"
                  :title="variant.title"
                  :disabled="!variant.available && variant.id !== selectedVariantId"
                  @click="selectVariant(variant.id)"
              />
            </div>

            <h1 class="text-3xl font-bold text-gray-900">{{ product.type }}</h1>
            <p class="text-gray-600 text-lg mt-1">{{ product.title }}</p>

            <p v-if="selectedVariant && !selectedVariant.available" class="text-red-600 text-sm mt-3">
              Этот вариант сейчас нет в наличии
            </p>

            <div v-if="product.details" class="mt-6 text-gray-700 whitespace-pre-line text-sm leading-6">
              {{ product.details }}
            </div>

            <div class="mt-auto pt-8">
              <Button
                  :label="formatXp(product.price)"
                  class="w-full"
                  :disabled="!canBuy"
                  @click="showConfirm = true"
              />
              <p v-if="!canAfford" class="text-sm text-red-600 mt-2 text-center">
                Недостаточно XP
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <OrderConfirmDialog
        v-model="showConfirm"
        :product="product"
        :variant="selectedVariant"
        :balance="balance"
        :is-submitting="isSubmitting"
        @confirm="createOrder"
    />

    <Dialog
        v-model:visible="showSuccess"
        header="Заказ оформлен"
        :modal="true"
        :draggable="false"
        class="w-full max-w-md"
        :pt="{
          header: { class: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 rounded-t-xl' },
          title: { class: 'text-white font-bold' }
        }"
    >
      <p class="text-gray-700 mt-2">
        Мы получили заказ. Статус доставки можно посмотреть в магазине.
      </p>
      <template #footer>
        <Button label="Вернуться в магазин" @click="goToShop" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import OrderConfirmDialog from '@/components/shop/OrderConfirmDialog.vue'
import api from '@/api/client'
import { formatXp, isCssColor, mediaUrl } from '@/utils/media'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const product = ref(null)
const balance = ref(0)
const selectedVariantId = ref(null)
const photoIndex = ref(0)
const imageLoaded = ref(true)
const showConfirm = ref(false)
const showSuccess = ref(false)

const selectedVariant = computed(() =>
    product.value?.variants?.find((v) => v.id === selectedVariantId.value) || null
)

const photos = computed(() => selectedVariant.value?.photos || [])

const currentPhoto = computed(() => photos.value[photoIndex.value]?.url || photos.value[0]?.url)

const canAfford = computed(() => balance.value >= (product.value?.price || 0))

const canBuy = computed(() =>
    Boolean(selectedVariant.value?.available) && canAfford.value && !isSubmitting.value
)

const selectVariant = (variantId) => {
  selectedVariantId.value = variantId
  photoIndex.value = 0
  imageLoaded.value = true
}

const loadProduct = async () => {
  const productId = Number(route.params.id)
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [productRes, balanceRes] = await Promise.all([
      api.get(`/api/products/${productId}`),
      api.get('/api/balance'),
    ])
    product.value = productRes.data
    balance.value = typeof balanceRes.data === 'number' ? balanceRes.data : Number(balanceRes.data) || 0
    const variants = product.value?.variants || []
    const defaultVariant = variants.find((v) => v.default) || variants[0]
    selectedVariantId.value = defaultVariant?.id ?? null
    photoIndex.value = 0
    imageLoaded.value = true
  } catch (error) {
    product.value = null
    errorMessage.value = error.response?.data || error.message || 'Товар не найден'
  } finally {
    isLoading.value = false
  }
}

const createOrder = async () => {
  if (!product.value || !selectedVariant.value) return

  isSubmitting.value = true
  try {
    await api.post('/api/orders', {
      productId: product.value.id,
      variantId: selectedVariant.value.id,
    })
    showConfirm.value = false
    showSuccess.value = true
    const { data } = await api.get('/api/balance')
    balance.value = typeof data === 'number' ? data : Number(data) || 0
  } catch (error) {
    const message = typeof error.response?.data === 'string'
        ? error.response.data
        : 'Не удалось оформить заказ'
    toast.add({
      severity: 'error',
      summary: 'Ошибка заказа',
      detail: message,
      life: 5000,
    })
  } finally {
    isSubmitting.value = false
  }
}

const goToShop = () => {
  showSuccess.value = false
  router.push('/shop')
}

watch(
    () => route.params.id,
    () => {
      loadProduct()
    }
)

onMounted(loadProduct)
</script>
