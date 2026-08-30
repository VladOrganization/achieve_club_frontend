<route lang="yaml">
meta:
  requiresAuth: true
  requiresRoles: ['admin', 'supervisor']
</route>

<template>
  <div class="min-h-screen bg-canvas py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Заказы</h1>
          <p class="text-gray-600 mt-1">Всего: <span class="font-semibold">{{ filteredOrders.length }}</span></p>
        </div>
        <InputText
            v-model="searchQuery"
            placeholder="Поиск по имени или товару..."
            class="w-full md:w-72"
        />
      </div>

      <div class="flex flex-wrap gap-3 mb-6">
        <Button
            :label="`Все (${orders.length})`"
            :severity="statusFilter == null ? 'primary' : 'secondary'"
            text
            @click="statusFilter = null"
        />
        <Button
            v-for="status in statuses"
            :key="status.id"
            :label="status.title"
            :severity="statusFilter === status.id ? 'primary' : 'secondary'"
            text
            @click="statusFilter = status.id"
        />
      </div>

      <Skeleton v-if="isLoading" height="400px" />

      <Message
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mb-6 rounded-lg"
          @close="errorMessage = ''"
      />

      <div
          v-if="!isLoading && filteredOrders.length === 0"
          class="bg-white rounded-lg shadow-md p-12 text-center"
      >
        <i class="pi pi-inbox text-5xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">Заказов нет</p>
      </div>

      <div v-else-if="!isLoading" class="flex flex-col gap-3">
        <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="bg-white rounded-lg shadow-md p-4 flex flex-col lg:flex-row lg:items-center gap-4"
        >
          <div class="w-16 h-16 bg-canvas rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            <img
                v-if="order.photo"
                :src="mediaUrl(order.photo)"
                :alt="order.productTitle"
                class="max-h-full max-w-full object-contain"
            />
            <i v-else class="pi pi-box text-xl text-gray-300"></i>
          </div>

          <div class="flex-1 min-w-0">
            <button
                class="font-bold text-gray-900 hover:text-brand-600 text-left"
                @click="router.push(`/student/${order.userId}`)"
            >
              {{ order.firstName }} {{ order.lastName }}
            </button>
            <p class="text-sm text-gray-600">
              {{ order.productType }} {{ order.productTitle }}
              <span v-if="order.color"> · {{ order.color }}</span>
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ formatDateTime(order.orderDate) }}</p>
          </div>

          <p class="font-bold text-brand-600 shrink-0">{{ formatXp(order.price) }}</p>

          <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shrink-0"
              :style="{ backgroundColor: statusColor(order.deliveryColor) }"
          >
            {{ order.deliveryStatus }}
          </span>

          <div v-if="!isCancelledStatus(order.deliveryStatus)" class="flex flex-wrap gap-2 shrink-0">
            <Select
                :key="`${order.id}-${order.deliveryStatusId}`"
                :model-value="order.deliveryStatusId"
                :options="activeStatuses"
                option-label="title"
                option-value="id"
                :disabled="updatingId === order.id"
                class="w-56"
                @update:model-value="(statusId) => changeStatus(order, statusId)"
            />
            <Button
                v-if="!isReceivedStatus(order.deliveryStatus)"
                label="Отменить"
                severity="danger"
                size="small"
                :loading="updatingId === order.id"
                @click="confirmCancel(order)"
            />
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Skeleton from 'primevue/skeleton'
import Toast from 'primevue/toast'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import api from '@/api/client'
import { formatXp, isCancelledStatus, isReceivedStatus, mediaUrl } from '@/utils/media'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const isLoading = ref(false)
const updatingId = ref(null)
const errorMessage = ref('')
const searchQuery = ref('')
const statusFilter = ref(null)
const orders = ref([])
const statuses = ref([])

const activeStatuses = computed(() => statuses.value.filter((s) => !isCancelledStatus(s.title)))

const filteredOrders = computed(() => {
  let list = orders.value
  if (statusFilter.value != null) {
    list = list.filter((o) => o.deliveryStatusId === statusFilter.value)
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((o) => {
    const name = `${o.firstName} ${o.lastName}`.toLowerCase()
    const product = `${o.productType} ${o.productTitle}`.toLowerCase()
    return name.includes(q) || product.includes(q)
  })
})

const statusColor = (color) => {
  if (!color) return '#6366f1'
  return color.startsWith('#') ? color : `#${color}`
}

const formatDateTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('ru-RU')
}

const load = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [ordersRes, statusesRes] = await Promise.all([
      api.get('/api/orders/all'),
      api.get('/api/deliverystatuses'),
    ])
    orders.value = ordersRes.data || []
    statuses.value = statusesRes.data || []
  } catch (error) {
    errorMessage.value = error.response?.data || error.message || 'Не удалось загрузить заказы'
  } finally {
    isLoading.value = false
  }
}

const applyStatus = (order, status) => {
  if (!status) return
  const target = orders.value.find((item) => item.id === order.id)
  if (!target) return
  target.deliveryStatusId = status.id
  target.deliveryStatus = status.title
  target.deliveryColor = status.color
}

const changeStatus = async (order, statusId) => {
  const id = Number(statusId)
  if (id === order.deliveryStatusId) return
  updatingId.value = order.id
  try {
    await api.patch(`/api/orders/${order.id}/status`, { statusId: id })
    applyStatus(order, statuses.value.find((status) => status.id === id))
    toast.add({ severity: 'success', summary: 'Статус обновлён', life: 2500 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.response?.data || error.message,
      life: 4000,
    })
  } finally {
    updatingId.value = null
  }
}

const confirmCancel = (order) => {
  confirm.require({
    message: `Вернуть ${formatXp(order.price)} студенту ${order.firstName} ${order.lastName} и отменить заказ?`,
    header: 'Отмена заказа',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Отменить и вернуть XP',
    rejectLabel: 'Назад',
    acceptClass: 'p-button-danger',
    accept: () => cancelOrder(order),
  })
}

const cancelOrder = async (order) => {
  updatingId.value = order.id
  try {
    await api.post(`/api/orders/${order.id}/cancel`)
    const cancelled = statuses.value.find((status) => isCancelledStatus(status.title))
    if (cancelled) {
      applyStatus(order, cancelled)
    } else {
      await load()
    }
    toast.add({ severity: 'success', summary: 'Заказ отменён, XP возвращены', life: 3000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: error.response?.data || error.message,
      life: 4000,
    })
  } finally {
    updatingId.value = null
  }
}

onMounted(load)
</script>
