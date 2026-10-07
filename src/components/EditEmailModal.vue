<template>
  <Dialog
      v-model:visible="model"
      header="Смена почты"
      :modal="true"
      :draggable="false"
      class="w-full max-w-md"
      @hide="resetForm"
  >
    <!-- Шаг 1: ввод новой почты -->
    <div v-if="currentStep === 1" class="space-y-4">
      <p class="text-stone-600 text-sm">
        Введите новую почту. Мы отправим на неё код подтверждения.
      </p>
      <p v-if="currentEmail" class="text-stone-500 text-sm">Текущая почта: {{ currentEmail }}</p>

      <div>
        <label for="edit-email" class="block text-sm font-medium text-stone-700 mb-2">Новая почта</label>
        <InputText
            id="edit-email"
            v-model="form.email"
            type="email"
            placeholder="example@mail.com"
            class="w-full"
            @keyup.enter="sendCode"
        />
        <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
      </div>
    </div>

    <!-- Шаг 2: код подтверждения -->
    <div v-else class="space-y-4">
      <p class="text-stone-600 text-sm">
        Мы отправили код подтверждения на {{ form.email }}. Проверьте входящие письма (возможно, оно попало в «Спам»)
      </p>

      <div>
        <label for="edit-email-code" class="block text-sm font-medium text-stone-700 mb-2">Код подтверждения</label>
        <InputText
            id="edit-email-code"
            v-model="form.code"
            placeholder="0000"
            class="w-full"
            maxlength="4"
            @keyup.enter="confirm"
        />
        <p v-if="errors.code" class="text-red-500 text-sm mt-1">{{ errors.code }}</p>
      </div>

      <div class="text-sm text-stone-600">
        <span>Не получили код? </span>
        <button
            type="button"
            :disabled="resendCountdown > 0 || isLoading"
            class="text-primary-600 hover:text-primary-800 font-medium disabled:text-stone-400"
            @click="sendCode"
        >
          {{ resendCountdown > 0 ? `Повторить (${resendCountdown}s)` : 'Отправить снова' }}
        </button>
      </div>
    </div>

    <Message v-if="errorMessage" severity="error" class="mt-4" @close="errorMessage = ''">
      {{ errorMessage }}
    </Message>

    <template #footer>
      <Button label="Отмена" severity="secondary" @click="model = false"/>
      <Button v-if="currentStep === 1" label="Отправить код" :loading="isLoading" @click="sendCode"/>
      <Button v-else label="Подтвердить" :loading="isLoading" @click="confirm"/>
    </template>
  </Dialog>
</template>

<script setup>
import {onBeforeUnmount, ref} from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import apiClient from '@/api/client.js'

defineProps({
  currentEmail: {type: String, default: ''},
})

const emit = defineEmits(['saved'])
const model = defineModel(false)

const currentStep = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')
const resendCountdown = ref(0)
const form = ref({email: '', code: ''})
const errors = ref({email: '', code: ''})
let timer = null

const stopTimer = () => {
  if (timer) clearInterval(timer)
  timer = null
}

const startResendCountdown = () => {
  stopTimer()
  resendCountdown.value = 60
  timer = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) stopTimer()
  }, 1000)
}

onBeforeUnmount(stopTimer)

const resetForm = () => {
  stopTimer()
  currentStep.value = 1
  form.value = {email: '', code: ''}
  errors.value = {email: '', code: ''}
  errorMessage.value = ''
  resendCountdown.value = 0
}

const validateEmail = () => {
  errors.value.email = ''
  const email = form.value.email.trim()
  if (!email) {
    errors.value.email = 'Email обязателен'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.value.email = 'Введите корректный email'
  }
  return !errors.value.email
}

const sendCode = async () => {
  errorMessage.value = ''
  if (!validateEmail()) return

  isLoading.value = true
  try {
    // тело — JSON-строка, как в «Забыли пароль»
    await apiClient.post('/api/email/change_email', JSON.stringify(form.value.email.trim()), {
      headers: {'Content-Type': 'application/json'}
    })
    currentStep.value = 2
    startResendCountdown()
  } catch (error) {
    const data = error.response?.data
    if (data === 'email') {
      errorMessage.value = 'Эта почта уже используется в приложении'
    } else if (data === 'same') {
      errorMessage.value = 'Это ваша текущая почта'
    } else if (data === 'timeout') {
      errorMessage.value = 'Подождите минуту перед повторной отправкой'
    } else {
      errorMessage.value = 'Ошибка при отправке кода'
    }
  } finally {
    isLoading.value = false
  }
}

const confirm = async () => {
  errorMessage.value = ''
  errors.value.code = ''

  if (!/^\d{4}$/.test(form.value.code)) {
    errors.value.code = 'Код должен содержать 4 цифры'
    return
  }

  isLoading.value = true
  try {
    await apiClient.patch('/api/users/change_email', {
      emailAddress: form.value.email.trim(),
      proofCode: Number(form.value.code)
    })
    emit('saved')
    model.value = false
  } catch (error) {
    const data = error.response?.data
    if (data === 'code') {
      errorMessage.value = 'Введен неверный код'
    } else if (data === 'email') {
      errorMessage.value = 'Эта почта уже используется в приложении'
    } else {
      errorMessage.value = 'Не удалось сменить почту, попробуйте снова'
    }
  } finally {
    isLoading.value = false
  }
}
</script>
