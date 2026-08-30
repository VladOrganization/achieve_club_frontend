<template>
  <Dialog
      v-model:visible="isVisible"
      header="Оформление заказа"
      :modal="true"
      :draggable="false"
      class="w-full max-w-lg"
      @hide="onHide"
      :pt="{
        header: { class: 'bg-gradient-to-r from-brand-500 to-brand-800 text-white border-0 rounded-t-xl' },
        title: { class: 'text-white font-bold' }
      }"
  >
    <div v-if="product && variant" class="bg-canvas rounded-lg p-4 border border-gray-200 flex gap-4 mt-2">
      <div class="w-24 h-24 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
        <img
            v-if="photo && imageLoaded"
            :src="mediaUrl(photo)"
            :alt="product.title"
            class="max-h-full max-w-full object-contain"
            @error="imageLoaded = false"
        />
        <i v-else class="pi pi-image text-2xl text-gray-300"></i>
      </div>
      <div class="min-w-0">
        <p class="text-xl font-bold text-brand-600">{{ formatXp(product.price) }}</p>
        <p class="font-bold text-gray-900 mt-1">{{ product.type }}</p>
        <p class="text-gray-600 text-sm">{{ product.title }}</p>
        <p class="text-gray-500 text-sm mt-1">Цвет: {{ variant.title || variant.color }}</p>
      </div>
    </div>

    <p v-if="!canAfford" class="text-sm text-red-600 mt-3">
      Недостаточно XP. Баланс: {{ formatXp(balance) }}
    </p>

    <template #footer>
      <Button label="Отменить" severity="secondary" @click="onCancel" />
      <Button
          label="Заказать"
          :loading="isSubmitting"
          :disabled="!canAfford"
          @click="$emit('confirm')"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { formatXp, mediaUrl } from '@/utils/media'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  product: { type: Object, default: null },
  variant: { type: Object, default: null },
  balance: { type: Number, default: 0 },
  isSubmitting: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const isVisible = ref(false)
const imageLoaded = ref(true)

watch(
    () => props.modelValue,
    (value) => {
      isVisible.value = value
      imageLoaded.value = true
    }
)

watch(isVisible, (value) => {
  emit('update:modelValue', value)
})

const photo = computed(() => {
  const photos = props.variant?.photos || []
  const defaultPhoto = photos.find((p) => p.default)
  return defaultPhoto?.url || photos[0]?.url
})

const canAfford = computed(() => props.balance >= (props.product?.price || 0))

const onCancel = () => {
  isVisible.value = false
  emit('cancel')
}

const onHide = () => {
  emit('update:modelValue', false)
}
</script>
