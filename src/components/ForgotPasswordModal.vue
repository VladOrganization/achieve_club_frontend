<template>
  <Dialog
      v-model:visible="isVisible"
      header="Восстановление пароля"
      :modal="true"
      :draggable="false"
      class="w-full max-w-md"
      @hide="resetForm"
  >
    <!-- Шаг 1: Ввод email -->
    <div v-if="currentStep === 1" class="space-y-4">
      <p class="text-gray-600 text-sm">
        Введите email для восстановления пароля
      </p>

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
            @keyup.enter="submitEmail"
        />
        <p v-if="errors.email" class="text-red-500 text-sm mt-1">
          {{ errors.email }}
        </p>
      </div>

      <Message
          v-if="successMessage"
          severity="success"
          :text="successMessage"
          class="mt-4"
      />

      <Message
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mt-4"
          @close="errorMessage = ''"
      />
    </div>

    <!-- Шаг 2: Ввод кода подтверждения -->
    <div v-if="currentStep === 2" class="space-y-4">
      <p class="text-gray-600 text-sm">
        Проверьте вашу почту. Мы отправили код подтверждения
      </p>

      <div>
        <label for="code" class="block text-sm font-medium text-gray-700 mb-2">
          Код подтверждения
        </label>
        <InputText
            id="code"
            v-model="form.code"
            placeholder="000000"
            class="w-full"
            maxlength="6"
            @keyup.enter="verifyCode"
        />
        <p v-if="errors.code" class="text-red-500 text-sm mt-1">
          {{ errors.code }}
        </p>
      </div>

      <div class="text-sm text-gray-600">
        <span>Не получили код? </span>
        <button
            type="button"
            :disabled="resendCountdown > 0"
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
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mt-4"
          @close="errorMessage = ''"
      />
    </div>

    <!-- Шаг 3: Установка нового пароля -->
    <div v-if="currentStep === 3" class="space-y-4">
      <p class="text-gray-600 text-sm">Установите новый пароль</p>

      <div>
        <label for="new-password" class="block text-sm font-medium text-gray-700 mb-2">
          Новый пароль
        </label>
        <Password
            id="new-password"
            v-model="form.newPassword"
            placeholder="••••••••"
            toggle-mask
            class="w-full"
            input-class="w-full"
            :feedback="false"
        />
        <p v-if="errors.newPassword" class="text-red-500 text-sm mt-1">
          {{ errors.newPassword }}
        </p>
      </div>

      <div>
        <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
          Подтверждение пароля
        </label>
        <Password
            id="confirm-password"
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

      <!-- Требования к паролю -->
      <div class="bg-blue-50 p-3 rounded-lg">
        <p class="text-sm font-medium text-gray-700 mb-2">Требования:</p>
        <ul class="text-sm text-gray-600 space-y-1">
          <li :class="{ 'text-green-600': form.newPassword.length >= 8 }">
            ✓ Минимум 8 символов
          </li>
          <li :class="{ 'text-green-600': /[A-Z]/.test(form.newPassword) }">
            ✓ Минимум одна заглавная буква
          </li>
          <li :class="{ 'text-green-600': /[0-9]/.test(form.newPassword) }">
            ✓ Минимум одна цифра
          </li>
        </ul>
      </div>

      <Message
          v-if="errorMessage"
          severity="error"
          :text="errorMessage"
          class="mt-4"
          @close="errorMessage = ''"
      />
    </div>

    <template #footer>
      <Button
          label="Отмена"
          severity="secondary"
          @click="closeDialog"
      />
      <Button
          v-if="currentStep === 1"
          label="Далее"
          :loading="isLoading"
          @click="submitEmail"
      />
      <Button
          v-if="currentStep === 2"
          label="Проверить"
          :loading="isLoading"
          @click="verifyCode"
      />
      <Button
          v-if="currentStep === 3"
          label="Установить пароль"
          :loading="isLoading"
          @click="resetPassword"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const modelValue = defineModel()

const emit = defineEmits(['success'])

const isVisible = ref(true)
const currentStep = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resendCountdown = ref(0)

const form = ref({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const errors = ref({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

const resetForm = () => {
  currentStep.value = 1
  form.value = {
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  }
  errors.value = {
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  }
  errorMessage.value = ''
  successMessage.value = ''
  resendCountdown.value = 0
}

const closeDialog = () => {
  isVisible.value = false
  resetForm()
}

// Шаг 1: Проверка email
const validateEmail = () => {
  errors.value.email = ''

  if (!form.value.email) {
    errors.value.email = 'Email обязателен'
    return false
  }

  if (!form.value.email.includes('@')) {
    errors.value.email = 'Введите корректный email'
    return false
  }

  return true
}

const submitEmail = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateEmail()) return

  isLoading.value = true

  try {
    // Замените на реальный API запрос
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // API вызов
    // const response = await fetch('/api/forgot-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: form.value.email }),
    // })

    successMessage.value = 'Код отправлен на вашу почту'
    currentStep.value = 2
    startResendCountdown()
  } catch (error) {
    errorMessage.value = error.message || 'Ошибка при отправке кода'
  } finally {
    isLoading.value = false
  }
}

// Шаг 2: Проверка кода
const validateCode = () => {
  errors.value.code = ''

  if (!form.value.code) {
    errors.value.code = 'Код обязателен'
    return false
  }

  if (form.value.code.length !== 6) {
    errors.value.code = 'Код должен содержать 6 символов'
    return false
  }

  return true
}

const verifyCode = async () => {
  errorMessage.value = ''

  if (!validateCode()) return

  isLoading.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // API вызов
    // const response = await fetch('/api/verify-code', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: form.value.email,
    //     code: form.value.code,
    //   }),
    // })

    currentStep.value = 3
  } catch (error) {
    errorMessage.value = error.message || 'Неверный код'
  } finally {
    isLoading.value = false
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
    await new Promise((resolve) => setTimeout(resolve, 1000))
    successMessage.value = 'Код повторно отправлен'
    startResendCountdown()
  } catch (error) {
    errorMessage.value = 'Ошибка при повторной отправке'
  } finally {
    isLoading.value = false
  }
}

// Шаг 3: Установка нового пароля
const validatePassword = () => {
  errors.value.newPassword = ''
  errors.value.confirmPassword = ''

  if (!form.value.newPassword) {
    errors.value.newPassword = 'Пароль обязателен'
    return false
  }

  if (form.value.newPassword.length < 8) {
    errors.value.newPassword = 'Пароль должен содержать минимум 8 символов'
    return false
  }

  if (!/[A-Z]/.test(form.value.newPassword)) {
    errors.value.newPassword = 'Требуется минимум одна заглавная буква'
    return false
  }

  if (!/[0-9]/.test(form.value.newPassword)) {
    errors.value.newPassword = 'Требуется минимум одна цифра'
    return false
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Пароли не совпадают'
    return false
  }

  return true
}

const resetPassword = async () => {
  errorMessage.value = ''

  if (!validatePassword()) return

  isLoading.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // API вызов
    // const response = await fetch('/api/reset-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: form.value.email,
    //     code: form.value.code,
    //     newPassword: form.value.newPassword,
    //   }),
    // })

    emit('success')
    closeDialog()
  } catch (error) {
    errorMessage.value = error.message || 'Ошибка при установке пароля'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>

</style>