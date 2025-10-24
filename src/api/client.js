import axios from 'axios'
import { API_CONFIG } from '@/api/config'

const apiClient = axios.create({
    baseURL: `${API_CONFIG.baseURL}:${API_CONFIG.port}`,
    timeout: 10000,
})

// Добавьте интерцептор для обработки ошибок
apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error)
        return Promise.reject(error)
    }
)

export default apiClient