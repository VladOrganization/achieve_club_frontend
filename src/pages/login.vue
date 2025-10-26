<template>
  <ForgotPasswordModal :v-model="true"/>

  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
      <!-- Заголовок -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Вход</h1>
        <p class="text-gray-600 text-sm mt-2">Введите ваши учетные данные</p>
      </div>

      <!-- Форма -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="example@mail.com"
              class="w-full"
              :class="{ 'ng-invalid ng-touched': errors.email }"
          />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">
            {{ errors.email }}
          </p>
        </div>

        <!-- Пароль -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Пароль
          </label>
          <Password
              id="password"
              v-model="form.password"
              placeholder="••••••••"
              :feedback="false"
              class="w-full"
              input-class="w-full"
          />
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">
            {{ errors.password }}
          </p>
        </div>

        <!-- Запомнить меня -->
        <div class="flex items-center">
          <Checkbox
              v-model="form.rememberMe"
              input-id="remember"
              binary
          />
          <label for="remember" class="ml-2 text-sm text-gray-700">
            Запомнить меня
          </label>
        </div>

        <!-- Кнопка входа -->
        <Button
            type="submit"
            label="Войти"
            class="w-full"
            :loading="isLoading"
            severity="primary"
        />
      </form>

      <!-- Дополнительные ссылки -->
      <div class="mt-6 flex items-center justify-between text-sm">
        <router-link
            to="/forgot-password"
            class="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Забыли пароль?
        </router-link>
        <router-link
            to="/register"
            class="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Зарегистрироваться
        </router-link>
      </div>

      <!-- Сообщение об ошибке -->
      <Message
          v-if="globalError"
          severity="error"
          :text="globalError"
          class="mt-4"
          @close="globalError = ''"
      />
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import ForgotPasswordModal from "@/components/ForgotPasswordModal.vue";
import api from '@/api/client'
import {useAuthStore} from "@/stores/auth.js";

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  rememberMe: false,
})

const errors = ref({
  email: '',
  password: '',
})

const isLoading = ref(false)
const globalError = ref('')

const validateForm = () => {
  errors.value = {email: '', password: ''}
  let isValid = true

  if (!form.value.email) {
    errors.value.email = 'Email обязателен'
    isValid = false
  } else if (!form.value.email.includes('@')) {
    errors.value.email = 'Введите корректный email'
    isValid = false
  }

  if (!form.value.password) {
    errors.value.password = 'Пароль обязателен'
    isValid = false
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Пароль должен содержать минимум 6 символов'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  globalError.value = ''

  if (!validateForm()) return

  isLoading.value = true

  try {
    // Замените на реальный API запрос
    const response = await api.post('/api/auth/login?api-version=1.1',
        {
          email: form.value.email,
          password: form.value.password,
        }
    )

    if (!response.ok) {
      throw new Error('Ошибка входа')
    }

    const data = await response.json()

    authStore.setAuthData(data.userId, data.authToken, data.refreshToken, data.role)

    // Перенаправьте на главную
    router.push('/')
  } catch (error) {
    globalError.value = error.message || 'Ошибка при входе. Проверьте учетные данные.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>

</style>