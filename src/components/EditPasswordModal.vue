<template>
  <Dialog
      v-model:visible="model"
      header="Смена пароля"
      :modal="true"
      :draggable="false"
      class="w-full max-w-md"
      @hide="resetForm"
  >
    <div class="space-y-4">
      <div>
        <label for="edit-new-password" class="block text-sm font-medium text-stone-700 mb-2">
          Новый пароль
        </label>
        <Password
            id="edit-new-password"
            v-model="form.newPassword"
            placeholder="••••••••"
            toggle-mask
            class="w-full"
            input-class="w-full"
            :feedback="false"
        />
        <p v-if="errors.newPassword" class="text-red-500 text-sm mt-1">{{ errors.newPassword }}</p>
      </div>

      <div>
        <label for="edit-confirm-password" class="block text-sm font-medium text-stone-700 mb-2">
          Подтверждение пароля
        </label>
        <Password
            id="edit-confirm-password"
            v-model="form.confirmPassword"
            placeholder="••••••••"
            toggle-mask
            class="w-full"
            input-class="w-full"
            :feedback="false"
            @keyup.enter="save"
        />
        <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">{{ errors.confirmPassword }}</p>
      </div>

      <div class="bg-primary-50 p-3 rounded-lg">
        <p class="text-sm font-medium text-stone-700 mb-2">Требования:</p>
        <ul class="text-sm text-stone-600 space-y-1">
          <li :class="{ 'text-green-600': form.newPassword.length >= 8 }">✓ Минимум 8 символов</li>
          <li :class="{ 'text-green-600': /[A-Z]/.test(form.newPassword) }">✓ Минимум одна заглавная буква</li>
          <li :class="{ 'text-green-600': /[0-9]/.test(form.newPassword) }">✓ Минимум одна цифра</li>
          <li :class="{ 'text-green-600': form.newPassword.length > 0 && form.newPassword === form.confirmPassword }">
            ✓ Пароль и подтверждение должны совпадать
          </li>
        </ul>
      </div>

      <Message v-if="errorMessage" severity="error" @close="errorMessage = ''">
        {{ errorMessage }}
      </Message>
    </div>

    <template #footer>
      <Button label="Отмена" severity="secondary" @click="model = false"/>
      <Button label="Сменить пароль" :loading="isLoading" :disabled="!isPasswordValid" @click="save"/>
    </template>
  </Dialog>
</template>

<script setup>
import {computed, ref} from 'vue'
import Dialog from 'primevue/dialog'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import apiClient from '@/api/client.js'

const emit = defineEmits(['saved'])
const model = defineModel(false)

const isLoading = ref(false)
const errorMessage = ref('')
const form = ref({newPassword: '', confirmPassword: ''})
const errors = ref({newPassword: '', confirmPassword: ''})

const isPasswordValid = computed(() =>
    form.value.newPassword.length >= 8 &&
    /[A-Z]/.test(form.value.newPassword) &&
    /[0-9]/.test(form.value.newPassword) &&
    form.value.newPassword === form.value.confirmPassword
)

const resetForm = () => {
  form.value = {newPassword: '', confirmPassword: ''}
  errors.value = {newPassword: '', confirmPassword: ''}
  errorMessage.value = ''
}

const validate = () => {
  errors.value = {newPassword: '', confirmPassword: ''}

  if (!form.value.newPassword) {
    errors.value.newPassword = 'Пароль обязателен'
  } else if (form.value.newPassword.length < 8) {
    errors.value.newPassword = 'Пароль должен содержать минимум 8 символов'
  } else if (!/[A-Z]/.test(form.value.newPassword)) {
    errors.value.newPassword = 'Требуется минимум одна заглавная буква'
  } else if (!/[0-9]/.test(form.value.newPassword)) {
    errors.value.newPassword = 'Требуется минимум одна цифра'
  } else if (form.value.newPassword !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Пароли не совпадают'
  }

  return !errors.value.newPassword && !errors.value.confirmPassword
}

const save = async () => {
  errorMessage.value = ''
  if (!validate()) return

  isLoading.value = true
  try {
    await apiClient.patch('/api/users/change_password', {password: form.value.newPassword})
    emit('saved')
    model.value = false
  } catch (error) {
    errorMessage.value = 'Ошибка при изменении пароля, попробуйте снова'
  } finally {
    isLoading.value = false
  }
}
</script>
