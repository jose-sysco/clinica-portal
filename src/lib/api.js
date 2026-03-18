import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = 'http://localhost:3010'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor - agrega el token y el slug automaticamente a cada request
api.interceptors.request.use((config) => {
    const token = Cookies.get('token')
    const slug = Cookies.get('organization_slug')

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }

    if (slug) {
        config.headers['X-Organization-Slug'] = slug
    }

    return config
})

// Interceptor - maneja errores globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove('token')
            Cookies.remove('organization_slug')
            window.location.href = '/login'
        }
        if (error.response?.status === 402) {
            const code = error.response?.data?.code
            window.location.href = `/subscription-required?reason=${code || 'expired'}`
        }
        return Promise.reject(error)
    }
)

export default api