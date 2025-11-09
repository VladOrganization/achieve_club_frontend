import axios from 'axios'
import {API_CONFIG} from '@/api/config'
import {useAuthStore} from '@/stores/auth'
import router from '@/router'

const apiClient = axios.create({
    baseURL: `${API_CONFIG.baseURL}:${API_CONFIG.port}`,
    timeout: 10000,
})

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

apiClient.interceptors.request.use(
    config => {
        const authStore = useAuthStore()

        if (config.skipAuthHeader) {
            delete config.skipAuthHeader
            return config
        }

        if (authStore.authToken) {
            config.headers.Authorization = `Bearer ${authStore.authToken}`
        }
        return config
    },
    error => Promise.reject(error)
)

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.log('=== API Error ===')

        const {response, config} = error
        const authStore = useAuthStore()

        // Защита от перехвата refresh запроса
        if (config.url.includes('/auth/refresh')) {
            console.log('Refresh request failed with 401')
            authStore.logout()

            router.isReady().then(() => {
                console.log('Redirecting to login')
                router.push('/login')
            })

            return Promise.reject(error)
        }

        if (response?.status === 401 && authStore.refreshToken) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({resolve, reject})
                }).then(token => {
                    config.headers.Authorization = `Bearer ${token}`
                    return apiClient(config)
                })
            }

            isRefreshing = true

            console.log('Sending refresh token...')

            return apiClient.post(
                '/api/auth/refresh?api-version=1.1',
                {
                    userId: authStore.userId,
                    refreshToken: authStore.refreshToken,
                },
                {skipAuthHeader: true}
            ).then(res => {
                console.log('Refresh success!')
                const {authToken, refreshToken} = res.data
                authStore.updateTokens(authToken, refreshToken)
                config.headers.Authorization = `Bearer ${authToken}`
                processQueue(null, authToken)
                return apiClient(config)
            }).catch(err => {
                console.log('Refresh failed!')
                processQueue(err, null)
                authStore.logout()

                router.isReady().then(() => {
                    router.push('/login')
                })

                return Promise.reject(err)
            })
        }

        if (response?.status === 401) {
            console.log('401 - logging out')
            authStore.logout()
            router.isReady().then(() => {
                router.push('/login')
            })
        }

        return Promise.reject(error)
    }
)

export default apiClient