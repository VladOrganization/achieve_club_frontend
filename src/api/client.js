import axios from 'axios'
import {API_CONFIG} from '@/api/config'
import {useAuthStore} from '@/stores/auth'
import {useRouter} from "vue-router"

const apiClient = axios.create({
    baseURL: `${API_CONFIG.baseURL}:${API_CONFIG.port}`,
    timeout: 10000,
})

// Флаг для предотвращения множественных refresh запросов
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })

    isRefreshing = false
    failedQueue = []
}

// Request interceptor - добавляем токен в каждый запрос
apiClient.interceptors.request.use(
    config => {
        const authStore = useAuthStore()
        if (authStore.authToken) {
            config.headers.Authorization = `Bearer ${authStore.authToken}`
        }
        return config
    },
    error => Promise.reject(error)
)

// Response interceptor - обработка 401 и refresh
apiClient.interceptors.response.use(
    response => response,
    error => {
        const {response, config} = error
        const authStore = useAuthStore()
        const router = useRouter()

        // Если статус 401
        if (response?.status === 401 && authStore.refreshToken) {
            // Если уже идет refresh, добавляем запрос в очередь
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({resolve, reject})
                }).then(token => {
                    config.headers.Authorization = `Bearer ${token}`
                    return apiClient(config)
                })
            }

            isRefreshing = true

            // Вызываем refresh endpoint
            return apiClient.post(
                '/api/auth/refresh?api-version=1.1',
                {
                    userId: authStore.userId,
                    refreshToken: authStore.refreshToken,
                },
                {
                    skipAuthHeader: true, // Пропускаем auth header для этого запроса
                }
            ).then(res => {
                const {authToken, refreshToken, role} = res.data

                // Обновляем store
                authStore.updateTokens(authToken, refreshToken)

                // Обновляем Authorization header для оригинального запроса
                config.headers.Authorization = `Bearer ${authToken}`

                // Обрабатываем очередь ожидающих запросов
                processQueue(null, authToken)

                // Повторяем оригинальный запрос
                return apiClient(config)
            }).catch(err => {
                // Refresh не сработал - перенаправляем на логин
                processQueue(err, null)
                authStore.logout()
                router.push('/login')
                return Promise.reject(err)
            })
        }

        // Для других ошибок
        if (response?.status === 401) {
            authStore.logout()
            router.push('/login')
        }

        console.error('API Error:', error)
        return Promise.reject(error)
    }
)

export default apiClient