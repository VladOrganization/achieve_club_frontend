<template>
  <div ref="rootEl" class="flex flex-col items-center gap-2 w-full">
    <div v-if="isLoading" class="h-10 flex items-center text-stone-500 text-sm">
      <i class="pi pi-spin pi-spinner mr-2"></i>Подождите...
    </div>
    <!-- Видимая кнопка нашего размера; настоящая кнопка Google лежит поверх невидимой и ловит клики -->
    <div v-show="!isLoading" ref="holder" class="relative w-full h-[42px] overflow-hidden">
      <div
          class="absolute inset-0 flex items-center justify-center gap-3 rounded-md border border-stone-300 bg-white text-stone-800 text-sm pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/>
          <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.100 0 24s.9 7.600 2.600 10.800l7.900-6.100z"/>
          <path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.700-6c-2.100 1.400-4.900 2.300-8.200 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z"/>
        </svg>
        <span>{{ mode === 'login' ? 'Вход через аккаунт Google' : 'Регистрация через Google' }}</span>
      </div>
      <div ref="buttonRoot" class="absolute top-0 left-0 opacity-0 origin-top-left"></div>
    </div>
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
const rootEl = ref(null)
const holder = ref(null)
const buttonRoot = ref(null)

// Растягиваем невидимую кнопку Google на всю видимую область
const fitGoogleButton = () => {
  const el = buttonRoot.value
  if (!el || !holder.value) return
  el.style.transform = ''
  const w = el.offsetWidth
  const h = el.offsetHeight
  if (!w || !h) return
  el.style.transform = `scale(${holder.value.clientWidth / w}, ${holder.value.clientHeight / h})`
}
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
    width: Math.min(400, Math.max(200, Math.floor(holder.value.clientWidth))),
  })
  fitGoogleButton()
  const ro = new ResizeObserver(fitGoogleButton)
  ro.observe(holder.value)
  ro.observe(buttonRoot.value)
})
</script>
