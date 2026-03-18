import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = 'http://localhost:3010'

const superadminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Solo adjunta el token — sin X-Organization-Slug (superadmin opera sin tenant)
superadminApi.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

superadminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      Cookies.remove('token')
      Cookies.remove('organization_slug')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default superadminApi
