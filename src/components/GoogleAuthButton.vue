<template>
  <div class="flex flex-col items-center gap-2">
    <div v-if="isLoading" class="h-10 flex items-center text-stone-500 text-sm">
      <i class="pi pi-spin pi-spinner mr-2"></i>Подождите...
    </div>
    <div ref="buttonRoot" :class="{ hidden: isLoading }"></div>
    <Message v-if="error" severity="error" class="w-full" @close="error = ''">{{ error }}</Message>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import Message from 'primevue/message'
import api from '@/api/client'
import {useAuthStore} from '@/stores/auth.js'

// mode: 'login' | 'registration'
const props = defineProps({
  mode: {type: String, required: true},
})

const GSI_SRC = 'https://accounts.google.com/gsi/client'

const router = useRouter()
const authStore = useAuthStore()
const buttonRoot = ref(null)
const isLoading = ref(false)
const error = ref('')

const loadGsi = () => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve()
  let script = document.querySelector(`script[src="${GSI_SRC}"]`)
  if (!script) {
    script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    document.head.appendChild(script)
  }
  script.addEventListener('load', resolve)
  script.addEventListener('error', () => reject(new Error('gsi')))
})

const errorText = (e) => {
  const status = e.response?.status
  const data = e.response?.data
  if (status === 404 && data === 'not_registered') return 'Аккаунт с такой почтой не найден. Сначала зарегистрируйтесь.'
  if (status === 409 && data === 'email') return 'Пользователь с такой почтой уже зарегистрирован. Войдите через Google или email.'
  if (status === 409 && data === 'name') return 'Пользователь с таким именем и фамилией уже существует. Зарегистрируйтесь через форму.'
  if (status === 401) return 'Не удалось подтвердить аккаунт Google'
  return 'Ошибка авторизации через Google'
}

const onCredential = async ({credential}) => {
  error.value = ''
  isLoading.value = true
  try {
    const {data} = await api.post(`/api/auth/google/${props.mode}?api-version=1.1`, {idToken: credential})
    authStore.setAuthData(data.userId, data.authToken, data.refreshToken, data.role)
    router.push('/')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  let clientId
  try {
    // Client ID хранится в env бэкенда
    const [{data}] = await Promise.all([
      api.get('/api/auth/google/client-id?api-version=1.1', {skipAuthHeader: true}),
      loadGsi(),
    ])
    clientId = data
  } catch {
    error.value = 'Не удалось загрузить Google. Проверьте соединение.'
    return
  }
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: onCredential,
    use_fedcm_for_prompt: true,
  })
  window.google.accounts.id.renderButton(buttonRoot.value, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    text: props.mode === 'login' ? 'signin_with' : 'signup_with',
    locale: 'ru',
    width: 320,
  })
})
</script>
