<template>
  <div v-if="orders.length" class="bg-white rounded-lg shadow-md overflow-hidden">
    <button
        type="button"
        class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-canvas transition-colors"
        @click="expanded = !expanded"
    >
      <span class="font-bold text-gray-900">Полученные заказы</span>
      <span class="flex items-center gap-2 text-sm text-gray-500">
        {{ orders.length }}
        <i :class="expanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
      </span>
    </button>

    <div v-if="expanded" class="border-t border-gray-100 divide-y divide-gray-100">
      <div
          v-for="order in sortedOrders"
          :key="order.id"
          class="flex items-center gap-3 px-6 py-3"
      >
        <div class="w-12 h-12 bg-canvas rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          <img
              v-if="order.photo"
              :src="mediaUrl(order.photo)"
              :alt="order.productTitle"
              class="max-h-full max-w-full object-contain"
          />
          <i v-else class="pi pi-box text-lg text-gray-300"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">
            {{ order.productType }} {{ order.productTitle }}
            <span v-if="order.color" class="text-gray-500 font-normal"> · {{ order.color }}</span>
          </p>
          <p class="text-xs text-gray-500">{{ formatDate(order.orderDate) }}</p>
        </div>
        <span
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white shrink-0"
            :style="{ backgroundColor: statusColor(order.deliveryColor) }"
        >
          {{ order.deliveryStatus }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatDate, mediaUrl } from '@/utils/media'

const props = defineProps({
  orders: { type: Array, default: () => [] },
})

const expanded = ref(false)

const sortedOrders = computed(() =>
    [...props.orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
)

const statusColor = (color) => {
  if (!color) return '#10B981'
  return color.startsWith('#') ? color : `#${color}`
}
</script>
