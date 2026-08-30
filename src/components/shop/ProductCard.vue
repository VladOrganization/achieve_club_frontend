<template>
  <div
      class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      @click="$emit('open')"
  >
    <div class="bg-gray-50 p-4 flex items-center justify-center h-52 relative">
      <img
          v-if="photo && imageLoaded"
          :src="mediaUrl(photo)"
          :alt="product.title"
          class="max-h-44 max-w-full object-contain"
          @error="imageLoaded = false"
      />
      <div
          v-else
          class="w-full h-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
      >
        <i class="pi pi-image text-4xl text-white"></i>
      </div>
      <div v-if="product.variants?.length > 1" class="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        <span
            v-for="variant in product.variants"
            :key="variant.id"
            class="w-2.5 h-2.5 rounded-full border border-gray-300"
            :style="{ backgroundColor: isCssColor(variant.color) ? variant.color : '#9ca3af' }"
        />
      </div>
    </div>

    <div class="p-4 flex flex-col gap-3 flex-1">
      <div>
        <h3 class="font-bold text-gray-900">{{ product.type }}</h3>
        <p class="text-gray-600 text-sm mt-0.5">{{ product.title }}</p>
      </div>
      <Button
          :label="formatXp(product.price)"
          class="w-full mt-auto"
          :disabled="!hasAvailableVariant"
          @click.stop="$emit('open')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import { formatXp, isCssColor, mediaUrl } from '@/utils/media'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

defineEmits(['open'])

const imageLoaded = ref(true)

const defaultVariant = computed(() => {
  const variants = props.product.variants || []
  return variants.find((v) => v.default === true) || variants[0]
})

const photo = computed(() => defaultVariant.value?.photo)

const hasAvailableVariant = computed(() =>
    (props.product.variants || []).some((v) => v.available)
)

watch(photo, () => {
  imageLoaded.value = true
})
</script>
