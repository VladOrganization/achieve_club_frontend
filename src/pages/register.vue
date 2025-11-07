<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
      <!-- Заголовок -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Регистрация</h1>
        <p class="text-gray-600 text-sm mt-2">Создайте новый аккаунт</p>
      </div>

      <!-- Индикатор этапов -->
      <div class="flex justify-between items-center mb-8">
        <div
            v-for="step in 3"
            :key="step"
            class="flex items-center"
            :class="[step == 3 ? 'w-12' : 'w-full']"
        >
          <div
              :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
              currentStep >= step
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-300 text-gray-600',
            ]"
          >
            {{ step }}
          </div>
          <div
              v-if="step < 3"
              :class="[
              'flex-1 h-1 mx-2',
              currentStep > step ? 'bg-indigo-600' : 'bg-gray-300',
            ]"
          />
        </div>
      </div>

      <!-- Этап 1: Личные данные -->
      <form v-if="currentStep === 1" @submit.prevent="nextStep" class="space-y-4">
        <div>
          <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
            Имя *
          </label>
          <InputText
              id="firstName"
              v-model="form.firstName"
              placeholder="Иван"
              class="w-full"
          />
          <p v-if="errors.firstName" class="text-red-500 text-sm mt-1">
            {{ errors.firstName }}
          </p>
        </div>

        <div>
          <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
            Фамилия *
          </label>
          <InputText
              id="lastName"
              v-model="form.lastName"
              placeholder="Иванов"
              class="w-full"
          />
          <p v-if="errors.lastName" class="text-red-500 text-sm mt-1">
            {{ errors.lastName }}
          </p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="example@mail.com"
              class="w-full"
          />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">
            {{ errors.email }}
          </p>
        </div>

        <Message
            v-if="errorMessage"
            severity="error"
            class="mt-4"
            @close="errorMessage = ''">
          {{ errorMessage }}
        </Message>

        <div class="flex gap-3 mt-6">
          <Button
              label="Назад"
              severity="secondary"
              class="flex-1"
              @click="goToLogin"
          />
          <Button
              label="Далее"
              class="flex-1"
              @click="nextStep"
          />
        </div>
      </form>

      <!-- Этап 2: Установка пароля -->
      <form v-if="currentStep === 2" @submit.prevent="nextStep" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Пароль *
          </label>
          <Password
              id="password"
              v-model="form.password"
              placeholder="••••••••"
              toggle-mask
              class="w-full"
              input-class="w-full"
              :feedback="false"
          />
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">
            {{ errors.password }}
          </p>

          <!-- Требования к паролю -->
          <div class="bg-blue-50 p-3 rounded-lg mt-3">
            <p class="text-xs font-medium text-gray-700 mb-2">Требования:</p>
            <ul class="text-xs text-gray-600 space-y-1">
              <li :class="{ 'text-green-600': form.password.length >= 8 }">
                {{ form.password.length >= 8 ? '✓' : '○' }} Минимум 8 символов
              </li>
              <li :class="{ 'text-green-600': /[A-Z]/.test(form.password) }">
                {{ /[A-Z]/.test(form.password) ? '✓' : '○' }} Заглавная буква
              </li>
              <li :class="{ 'text-green-600': /[a-z]/.test(form.password) }">
                {{ /[a-z]/.test(form.password) ? '✓' : '○' }} Строчная буква
              </li>
              <li :class="{ 'text-green-600': /[0-9]/.test(form.password) }">
                {{ /[0-9]/.test(form.password) ? '✓' : '○' }} Цифра
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
            Подтверждение пароля *
          </label>
          <Password
              id="confirmPassword"
              v-model="form.confirmPassword"
              placeholder="••••••••"
              toggle-mask
              class="w-full"
              input-class="w-full"
              :feedback="false"
          />
          <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <Message
            v-if="errorMessage"
            severity="error"
            class="mt-4"
            @close="errorMessage = ''">
          {{ errorMessage }}
        </Message>

        <div class="flex gap-3 mt-6">
          <Button
              label="Назад"
              severity="secondary"
              class="flex-1"
              @click="previousStep"
          />
          <Button
              label="Далее"
              class="flex-1"
              @click="nextStep"
          />
        </div>
      </form>

      <!-- Этап 3: Подтверждение email -->
      <form v-if="currentStep === 3" @submit.prevent="completeRegistration" class="space-y-4">
        <div class="bg-blue-50 p-4 rounded-lg mb-4 text-center">
          <p class="text-sm text-gray-700">
            Мы отправили код подтверждения на:
            <br/>
          </p>
          <p class="font-semibold text-indigo-600">{{ form.email }}</p>
        </div>

        <div>
          <label for="verificationCode" class="block text-sm font-medium text-gray-700 mb-2">
            Код подтверждения *
          </label>
          <InputText
              id="verificationCode"
              v-model="form.verificationCode"
              placeholder="0000"
              class="w-full text-center text-2xl tracking-widest"
              maxlength="6"
              @keyup.enter="completeRegistration"
          />
          <p v-if="errors.verificationCode" class="text-red-500 text-sm mt-1">
            {{ errors.verificationCode }}
          </p>
        </div>

        <div class="text-sm text-center text-gray-600">
          <span>Не получили код? </span>
          <button
              type="button"
              :disabled="resendCountdown > 0 || isLoading"
              @click="resendCode"
              class="text-indigo-600 hover:text-indigo-800 font-medium disabled:text-gray-400"
          >
            {{
              resendCountdown > 0
                  ? `Повторить (${resendCountdown}s)`
                  : 'Отправить снова'
            }}
          </button>
        </div>

        <Message
            v-if="successMessage"
            severity="success"
            class="mt-4">
          {{ successMessage }}
        </Message>

        <Message
            v-if="errorMessage"
            severity="error"
            class="mt-4"
            @close="errorMessage = ''">
          {{ errorMessage }}
        </Message>

        <div class="flex gap-3 mt-6">
          <Button
              label="Назад"
              severity="secondary"
              class="flex-1"
              @click="previousStep"
          />
          <Button
              label="Завершить"
              class="flex-1"
              :loading="isLoading"
              @click="completeRegistration"
          />
        </div>
      </form>

      <!-- Ссылка на вход -->
      <div class="mt-6 text-center text-sm text-gray-600">
        <span>Уже есть аккаунт? </span>
        <router-link
            to="/login"
            class="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Войти
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import apiClient from "@/api/client.js";
import api from "@/api/client.js";
import {useAuthStore} from "@/stores/auth.js";

const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resendCountdown = ref(0)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

const errors = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

// Валидация этапа 1
const validateStep1 = () => {
  errors.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  }

  let isValid = true

  if (!form.value.firstName.trim()) {
    errors.value.firstName = 'Имя обязательно'
    isValid = false
  } else if (form.value.firstName.length < 2) {
    errors.value.firstName = 'Имя должно содержать минимум 2 символа'
    isValid = false
  }

  if (!form.value.lastName.trim()) {
    errors.value.lastName = 'Фамилия обязательна'
    isValid = false
  } else if (form.value.lastName.length < 2) {
    errors.value.lastName = 'Фамилия должна содержать минимум 2 символа'
    isValid = false
  }

  if (!form.value.email) {
    errors.value.email = 'Email обязателен'
    isValid = false
  } else if (!form.value.email.includes('@')) {
    errors.value.email = 'Введите корректный email'
    isValid = false
  }

  return isValid
}

// Валидация этапа 2
const validateStep2 = () => {
  errors.value.password = ''
  errors.value.confirmPassword = ''

  let isValid = true

  if (!form.value.password) {
    errors.value.password = 'Пароль обязателен'
    isValid = false
  } else if (form.value.password.length < 8) {
    errors.value.password = 'Пароль должен содержать минимум 8 символов'
    isValid = false
  } else if (!/[A-Z]/.test(form.value.password)) {
    errors.value.password = 'Требуется минимум одна заглавная буква'
    isValid = false
  } else if (!/[a-z]/.test(form.value.password)) {
    errors.value.password = 'Требуется минимум одна строчная буква'
    isValid = false
  } else if (!/[0-9]/.test(form.value.password)) {
    errors.value.password = 'Требуется минимум одна цифра'
    isValid = false
  }

  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Пароли не совпадают'
    isValid = false
  }

  return isValid
}

// Валидация этапа 3
const validateStep3 = () => {
  errors.value.verificationCode = ''

  if (!form.value.verificationCode) {
    errors.value.verificationCode = 'Код обязателен'
    return false
  }

  if (form.value.verificationCode.length !== 4) {
    errors.value.verificationCode = 'Код должен содержать 4 символа'
    return false
  }

  return true
}

const nextStep = async () => {
  errorMessage.value = ''

  if (currentStep.value === 1) {
    if (!validateStep1()) return

    isLoading.value = true

    try {
      // Проверка существования email (API запрос)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // const response = await fetch('/api/check-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: form.value.email }),
      // })

      currentStep.value = 2
    } catch (error) {
      errorMessage.value = error.message || 'Ошибка при проверке email'
    } finally {
      isLoading.value = false
    }
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return

    isLoading.value = true

    try {
      // Отправка данных регистрации и отправка кода
      await apiClient.post('api/email/proof_email', `"${form.value.email}"`,
          {
            headers: {'Content-Type': 'application/patch+json'}
          }
      )

      // const response = await fetch('/api/register-init', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     firstName: form.value.firstName,
      //     lastName: form.value.lastName,
      //     email: form.value.email,
      //     password: form.value.password,
      //   }),
      // })

      successMessage.value = 'Код подтверждения отправлен на вашу почту'
      currentStep.value = 3
      startResendCountdown()
    } catch
        (error) {
      errorMessage.value = error.message || 'Ошибка при отправке кода'
    } finally {
      isLoading.value = false
    }
  }
}

const previousStep = () => {
  errorMessage.value = ''
  successMessage.value = ''
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const startResendCountdown = () => {
  resendCountdown.value = 60
  const interval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(interval)
    }
  }, 1000)
}

const resendCode = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await apiClient.post('/email/proof_email', form.value.email)

    // const response = await fetch('/api/resend-code', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: form.value.email }),
    // })

    successMessage.value = 'Код повторно отправлен на вашу почту'
    startResendCountdown()
  } catch (error) {
    errorMessage.value = 'Ошибка при повторной отправке'
  } finally {
    isLoading.value = false
  }
}

const completeRegistration = async () => {
  errorMessage.value = ''

  if (!validateStep3()) return

  isLoading.value = true

  await apiClient.post('/api/auth/registration?api-version=1.1', {
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    emailAddress: form.value.email,
    password: form.value.password,
    proofCode: form.value.verificationCode,
    avatarURL: "default-avatar.webp"
  }).then((response) => {
    console.log('login', response.data)
    authStore.setAuthData(response.data.userId, response.data.authToken, response.data.refreshToken, response.data.role)
    router.push('/')
  }).catch(() => {
    errorMessage.value = error.message || 'Ошибка при подтверждении кода'
  }).finally(() => {
    isLoading.value = false
  })
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>

</style>