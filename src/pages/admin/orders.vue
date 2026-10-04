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
          <h1 class="text-3xl font-bold text-gray-900">Заказы</h1>
          <p class="text-gray-600 mt-1">Показано: <span class="font-semibold">{{ filteredOrders.length }}</span>
            из {{ orders.length }}</p>
        </div>
        <div class="flex gap-2">
          <InputText v-model="search" placeholder="Поиск по студенту или товару..." class="flex-1 sm:w-72"/>
          <Select v-model="statusFilter" :options="statusFilterOptions" option-label="title" option-value="id"
                  class="w-44"/>
          <PrimeButton icon="pi pi-refresh" severity="secondary" :loading="isLoading" @click="load"/>
        </div>
      </div>

      <div v-if="isLoading && orders.length === 0" class="text-center text-gray-500 py-10">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="filteredOrders.length === 0"
           class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        Заказов нет
      </div>

      <div v-else class="grid grid-cols-1 gap-3">
        <div
            v-for="order in filteredOrders"
            :key="order.id"
            class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row gap-4"
        >
          <img
              v-if="order.photo"
              :src="photoUrl(order.photo)"
              class="w-20 h-20 rounded-lg object-cover bg-gray-100 shrink-0"
              alt=""
          />
          <div v-else
               class="w-20 h-20 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
            <i class="pi pi-image text-2xl"></i>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span>№{{ order.id }}</span>
              <span>·</span>
              <span>{{ formatDate(order.orderDate) }}</span>
            </div>
            <p class="font-semibold text-gray-900">{{ order.productTitle }}
              <span class="text-gray-500 font-normal">({{ order.productType }})</span>
            </p>
            <p class="text-sm text-gray-700">
              Вариант: {{ order.variantName }}
              <span v-if="order.variantColor" class="text-gray-500">· {{ order.variantColor }}</span>
            </p>
            <p class="text-sm text-gray-700 mt-1">
              <i class="pi pi-user text-xs"></i>
              {{ order.userFirstName }} {{ order.userLastName }}
              <span class="text-gray-500 break-all">· {{ order.userEmail }}</span>
            </p>
            <p class="text-blue-600 font-bold mt-1">{{ order.price }} XP</p>
          </div>

          <div class="flex flex-col gap-2 sm:w-52 shrink-0" :class="{ 'justify-center': isCancelled(order) }">
            <span
                class="text-xs font-medium px-2 py-1 rounded-full text-white"
                :class="isCancelled(order) ? 'self-center' : 'self-start'"
                :style="{ backgroundColor: order.deliveryColor || '#6b7280' }"
            >{{ order.deliveryStatus }}</span>
            <Select
                v-if="!isCancelled(order)"
                :model-value="order.deliveryStatusId"
                :options="assignableStatuses"
                option-label="title"
                option-value="id"
                placeholder="Статус"
                :disabled="updatingId === order.id"
                @update:model-value="changeStatus(order, $event)"
            />
            <PrimeButton
                v-if="!isCancelled(order)"
                label="Отменить заказ"
                icon="pi pi-times"
                severity="danger"
                outlined
                size="small"
                :loading="cancellingId === order.id"
                :disabled="updatingId === order.id || cancellingId === order.id"
                @click="orderToCancel = order"
            />
          </div>
        </div>
      </div>
    </div>

    <Dialog
        :visible="!!orderToCancel"
        modal
        header="Отмена заказа"
        :style="{ width: '28rem' }"
        :closable="!cancellingId"
        :close-on-escape="!cancellingId"
        @update:visible="!$event && !cancellingId && (orderToCancel = null)"
    >
      <div v-if="orderToCancel" class="flex flex-col gap-3">
        <p class="text-gray-700">
          Отменить заказ <span class="font-semibold">№{{ orderToCancel.id }}</span>
          «{{ orderToCancel.productTitle }}» ({{ orderToCancel.variantName }})?
        </p>
        <ul class="text-sm text-gray-600 list-disc pl-5">
          <li>Товар вернётся на склад (+1 к количеству варианта)</li>
          <li>{{ orderToCancel.price }} XP вернутся на баланс {{ orderToCancel.userFirstName }}
            {{ orderToCancel.userLastName }}
          </li>
        </ul>
        <p class="text-sm text-gray-500">Это действие нельзя отменить.</p>
      </div>
      <template #footer>
        <PrimeButton label="Назад" severity="secondary" text :disabled="!!cancellingId"
                     @click="orderToCancel = null"/>
        <PrimeButton label="Отменить заказ" severity="danger" icon="pi pi-times" :loading="!!cancellingId"
                     @click="cancelOrder(orderToCancel)"/>
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

const orders = ref([])
const statuses = ref([])
const search = ref('')
const statusFilter = ref(0)
const isLoading = ref(false)
const updatingId = ref(null)
const cancellingId = ref(null)
const orderToCancel = ref(null)

const CANCELLED_STATUS = 'Отменён'
const isCancelled = (order) => order.deliveryStatus === CANCELLED_STATUS
const assignableStatuses = computed(() => statuses.value.filter(s => s.title !== CANCELLED_STATUS))

const statusFilterOptions = computed(() => [{id: 0, title: 'Все статусы'}, ...statuses.value])

const filteredOrders = computed(() => {
  const q = search.value.trim().toLowerCase()
  return orders.value.filter(o => {
    if (statusFilter.value && o.deliveryStatusId !== statusFilter.value) return false
    if (!q) return true
    return [o.userFirstName, o.userLastName, o.userEmail, o.productTitle, o.variantName]
        .some(s => (s || '').toLowerCase().includes(q))
  })
})

const photoUrl = (url) => {
  if (/^https?:\/\//.test(url)) return url
  return `${api.defaults.baseURL}/${url.replace(/^\/+/, '')}`
}

const formatDate = (date) => new Date(date).toLocaleString('ru-RU', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
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

const load = async () => {
  isLoading.value = true
  try {
    const [ordersRes, statusesRes] = await Promise.all([
      api.get('/api/admin/orders'),
      api.get('/api/admin/orders/statuses')
    ])
    orders.value = ordersRes.data || []
    statuses.value = statusesRes.data || []
  } catch (error) {
    showError(error)
  } finally {
    isLoading.value = false
  }
}

const changeStatus = async (order, statusId) => {
  if (statusId === order.deliveryStatusId) return

  updatingId.value = order.id
  try {
    await api.patch(`/api/admin/orders/${order.id}/status`, {deliveryStatusId: statusId})
    const status = statuses.value.find(s => s.id === statusId)
    order.deliveryStatusId = status.id
    order.deliveryStatus = status.title
    order.deliveryColor = status.color
    toast.add({severity: 'success', summary: `Заказ №${order.id}: ${status.title}`, life: 2500})
  } catch (error) {
    showError(error)
  } finally {
    updatingId.value = null
  }
}

const cancelOrder = async (order) => {
  cancellingId.value = order.id
  try {
    await api.post(`/api/admin/orders/${order.id}/cancel`)
    await load()
    toast.add({severity: 'success', summary: `Заказ №${order.id} отменён`, life: 2500})
  } catch (error) {
    showError(error)
  } finally {
    cancellingId.value = null
    orderToCancel.value = null
  }
}

onMounted(load)
</script>
