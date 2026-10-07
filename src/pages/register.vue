<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
      <!-- Заголовок -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-stone-800">Регистрация</h1>
        <p class="text-stone-600 text-sm mt-2">Создайте новый аккаунт</p>
      </div>

      <!-- Индикатор этапов -->
      <div class="flex justify-between items-center mb-8">
        <div
            v-for="step in 4"
            :key="step"
            class="flex items-center"
            :class="[step == 4 ? 'w-12' : 'w-full']"
        >
          <div
              :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
              currentStep >= step
                ? 'bg-primary-600 text-white'
                : 'bg-stone-300 text-stone-600',
            ]"
          >
            {{ step }}
          </div>
          <div
              v-if="step < 4"
              :class="[
              'flex-1 h-1 mx-2',
              currentStep > step ? 'bg-primary-600' : 'bg-stone-300',
            ]"
          />
        </div>
      </div>

      <!-- Этап 1: Личные данные -->
      <form v-if="currentStep === 1" @submit.prevent="nextStep" class="space-y-4">
        <div>
          <label for="firstName" class="block text-sm font-medium text-stone-700 mb-2">
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
          <label for="lastName" class="block text-sm font-medium text-stone-700 mb-2">
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
          <label for="email" class="block text-sm font-medium text-stone-700 mb-2">
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
              :disabled="!personalDataValid"
              :loading="isLoading"
              @click="nextStep"
          />
        </div>

        <div class="flex items-center gap-3 my-5 text-stone-400 text-sm">
          <div class="flex-1 h-px bg-stone-200"></div>
          <span>или</span>
          <div class="flex-1 h-px bg-stone-200"></div>
        </div>
        <GoogleAuthButton mode="registration"/>
      </form>

      <!-- Этап 2: Подтверждение email -->
      <form v-if="currentStep === 2" @submit.prevent="nextStep" class="space-y-4">
        <div class="bg-primary-50 p-4 rounded-lg mb-4 text-center">
          <p class="text-sm text-stone-700">
            Подтвердите свою почту, введя код из письма
          </p>
        </div>

        <div>
          <label for="verificationCode" class="block text-sm font-medium text-stone-700 mb-2">
            Код подтверждения *
          </label>
          <InputText
              id="verificationCode"
              :modelValue="form.verificationCode"
              placeholder="0000"
              class="w-full text-center text-2xl tracking-widest"
              @update:modelValue="v => form.verificationCode = (v ?? '').replace(/\s/g, '').slice(0, 6)"
              @keyup.enter="nextStep"
          />
          <p v-if="errors.verificationCode" class="text-red-500 text-sm mt-1">
            {{ errors.verificationCode }}
          </p>
        </div>

        <div class="text-sm text-center text-stone-600">
          <span>Не получили код? </span>
          <button
              type="button"
              :disabled="resendCountdown > 0 || isLoading"
              @click="resendCode"
              class="text-primary-600 hover:text-primary-800 font-medium disabled:text-stone-400"
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
              label="Далее"
              class="flex-1"
              :disabled="form.verificationCode.length !== 4"
              @click="nextStep"
          />
        </div>
      </form>

      <!-- Этап 3: Установка пароля -->
      <form v-if="currentStep === 3" @submit.prevent="goToAvatarStep" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-stone-700 mb-2">
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
          <div class="bg-primary-50 p-3 rounded-lg mt-3">
            <p class="text-xs font-medium text-stone-700 mb-2">Требования:</p>
            <ul class="text-xs text-stone-600 space-y-1">
              <li class="flex items-center gap-1.5" :class="{ 'text-green-600': form.password.length >= 8 }">
                <i :class="['pi', form.password.length >= 8 ? 'pi-check-circle' : 'pi-circle']"></i>
                <span>Минимум 8 символов</span>
              </li>
              <li class="flex items-center gap-1.5" :class="{ 'text-green-600': /[A-Z]/.test(form.password) }">
                <i :class="['pi', /[A-Z]/.test(form.password) ? 'pi-check-circle' : 'pi-circle']"></i>
                <span>Заглавная буква</span>
              </li>
              <li class="flex items-center gap-1.5" :class="{ 'text-green-600': /[a-z]/.test(form.password) }">
                <i :class="['pi', /[a-z]/.test(form.password) ? 'pi-check-circle' : 'pi-circle']"></i>
                <span>Строчная буква</span>
              </li>
              <li class="flex items-center gap-1.5" :class="{ 'text-green-600': /[0-9]/.test(form.password) }">
                <i :class="['pi', /[0-9]/.test(form.password) ? 'pi-check-circle' : 'pi-circle']"></i>
                <span>Цифра</span>
              </li>
              <li class="flex items-center gap-1.5" :class="{ 'text-green-600': passwordsMatch }">
                <i :class="['pi', passwordsMatch ? 'pi-check-circle' : 'pi-circle']"></i>
                <span>Пароль и подтверждение совпадают</span>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-stone-700 mb-2">
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
              :disabled="!passwordRequirementsMet"
              @click="goToAvatarStep"
          />
        </div>
      </form>

      <!-- Этап 4: Аватарка (обязательна, аккаунт создаётся только после её выбора) -->
      <div v-if="currentStep === 4" class="space-y-4">
        <div class="bg-primary-50 p-4 rounded-lg text-center">
          <p class="text-sm text-stone-700">
            Загрузите своё фото или выберите аватарку из списка
          </p>
        </div>

        <AvatarPicker
            v-model="avatarSelection"
            :disabled="isLoading"
            @error="errorMessage = $event"
        />

        <Message
            v-if="errorMessage"
            severity="error"
            class="mt-4"
            @close="errorMessage = ''">
          {{ errorMessage }}
        </Message>

        <div class="flex gap-3 mt-6">
          <Button
              v-if="!isRegistered"
              label="Назад"
              severity="secondary"
              class="flex-1"
              :disabled="isLoading"
              @click="previousStep"
          />
          <Button
              :label="isRegistered ? 'Сохранить фото' : 'Зарегистрироваться'"
              class="flex-1"
              :disabled="!avatarSelection"
              :loading="isLoading"
              @click="completeRegistration"
          />
        </div>
      </div>

      <!-- Ссылка на вход -->
      <div v-if="!isRegistered" class="mt-6 text-center text-sm text-stone-600">
        <span>Уже есть аккаунт? </span>
        <router-link
            to="/login"
            class="text-primary-600 hover:text-primary-800 font-medium"
        >
          Войти
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import {useRouter} from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import apiClient from "@/api/client.js";
import api from "@/api/client.js";
import {useAuthStore} from "@/stores/auth.js";
import GoogleAuthButton from "@/components/GoogleAuthButton.vue";
import AvatarPicker from "@/components/AvatarPicker.vue";
import {saveAvatar} from "@/api/avatars.js";

const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const resendCountdown = ref(0)
const avatarSelection = ref(null)
// Аккаунт уже создан, но своё фото не загрузилось — повторяем только загрузку фото
const isRegistered = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

const passwordsMatch = computed(
    () => form.value.password.length > 0 && form.value.password === form.value.confirmPassword
)

// Формат xxxxx@xxx.xxx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const personalDataValid = computed(() =>
    form.value.firstName.trim().length >= 2
    && form.value.lastName.trim().length >= 2
    && EMAIL_REGEX.test(form.value.email)
)

const passwordRequirementsMet = computed(() => {
  const password = form.value.password
  return password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /[0-9]/.test(password)
      && passwordsMatch.value
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
  } else if (!EMAIL_REGEX.test(form.value.email)) {
    errors.value.email = 'Введите корректный email'
    isValid = false
  }

  return isValid
}

// Валидация этапа 3 (пароль)
const validateStep3 = () => {
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

// Валидация этапа 2 (код)
const validateStep2 = () => {
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
      // Отправка кода подтверждения на почту
      await apiClient.post('api/email/proof_email', `"${form.value.email}"`,
          {
            headers: {'Content-Type': 'application/patch+json'}
          }
      )

      successMessage.value = `Код подтверждения отправлен на почту ${form.value.email}. Проверьте входящие письма (возможно, оно попало в «Спам»)`
      currentStep.value = 2
      startResendCountdown()
    } catch (error) {
      errorMessage.value = errorText(error, 'Ошибка при отправке кода')
    } finally {
      isLoading.value = false
    }
  } else if (currentStep.value === 2) {
    if (!validateStep2()) return

    successMessage.value = ''
    currentStep.value = 3
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

const errorText = (error, fallback) => {
  const data = error.response?.data
  if (data === 'timeout') return 'Подождите минуту перед повторной отправкой'
  if (data === 'email') return 'Пользователь с такой почтой уже зарегистрирован'
  if (data === 'name') return 'Пользователь с таким именем и фамилией уже зарегистрирован'
  if (data === 'avatar') return 'Эта аватарка больше недоступна, выберите другую'
  return fallback
}

const resendCode = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await apiClient.post('api/email/proof_email', `"${form.value.email}"`,
        {
          headers: {'Content-Type': 'application/patch+json'}
        }
    )

    // const response = await fetch('/api/resend-code', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email: form.value.email }),
    // })

    successMessage.value = 'Код повторно отправлен на вашу почту'
    startResendCountdown()
  } catch (error) {
    errorMessage.value = errorText(error, 'Ошибка при повторной отправке')
  } finally {
    isLoading.value = false
  }
}

const goToAvatarStep = () => {
  errorMessage.value = ''
  if (!validateStep3()) return
  currentStep.value = 4
}

// Регистрация происходит только после выбора фото: аватарка из списка уходит прямо в запросе регистрации,
// своё фото загружается сразу после создания аккаунта (для загрузки нужен токен)
const completeRegistration = async () => {
  errorMessage.value = ''

  if (!avatarSelection.value) {
    errorMessage.value = 'Выберите фото'
    return
  }

  isLoading.value = true

  try {
    if (!isRegistered.value) {
      const presetPath = avatarSelection.value.type === 'preset' ? avatarSelection.value.path : null

      const response = await apiClient.post('/api/auth/registration?api-version=1.1', {
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        emailAddress: form.value.email,
        password: form.value.password,
        proofCode: form.value.verificationCode,
        avatarURL: presetPath
      })
      authStore.setAuthData(response.data.userId, response.data.authToken, response.data.refreshToken, response.data.role)
      isRegistered.value = true

      if (presetPath) {
        await router.push('/')
        return
      }
    }

    await saveAvatar(avatarSelection.value)
    await router.push('/')
  } catch (error) {
    errorMessage.value = isRegistered.value
        ? 'Аккаунт создан, но фото не сохранилось. Попробуйте ещё раз или выберите другое фото'
        : errorText(error, 'Ошибка при регистрации')
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>

</style>