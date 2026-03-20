import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010'

// Slug interno fijo — superadmin opera bajo su propia organización de sistema
const SUPERADMIN_SLUG = 'clinicaportal-admin'

const superadminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// ── Request interceptor ───────────────────────────────────────────────────────
// Adjunta token de acceso con slug fijo de superadmin (sin depender de cookie de org)

superadminApi.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  config.headers['X-Organization-Slug'] = SUPERADMIN_SLUG
  return config
})

// ── Refresh logic ─────────────────────────────────────────────────────────────

let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token)
  })
  failedQueue = []
}

const clearSession = () => {
  Cookies.remove('token')
  Cookies.remove('refresh_token')
  Cookies.remove('organization_slug')
  window.location.href = '/superadmin/login'
}

const attemptRefresh = async () => {
  const rawRefresh = Cookies.get('refresh_token')
  if (!rawRefresh) throw new Error('no_refresh_token')

  // Usamos axios directamente para evitar el interceptor response (loop infinito)
  const response = await axios.post(
    `${API_URL}/api/v1/auth/refresh`,
    { refresh_token: rawRefresh },
    { headers: { 'X-Organization-Slug': SUPERADMIN_SLUG, 'Content-Type': 'application/json' } }
  )

  const { token, refresh_token: newRefresh } = response.data

  Cookies.set('token',         token,      { expires: 1 / 24 })  // 1 hora
  Cookies.set('refresh_token', newRefresh, { expires: 30 })       // 30 días

  return token
}

// ── Response interceptor ──────────────────────────────────────────────────────

superadminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // ── 401: intentar renovar token ────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return superadminApi(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await attemptRefresh()

        superadminApi.defaults.headers['Authorization'] = `Bearer ${newToken}`
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        processQueue(null, newToken)

        return superadminApi(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null)
        clearSession()
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    // ── 403: acceso denegado (no superadmin) ──────────────────────────────
    if (error.response?.status === 403) {
      clearSession()
    }

    // ── 429: rate limited ─────────────────────────────────────────────────
    if (error.response?.status === 429) {
      const retryAfter = error.response?.headers?.['retry-after']
      const seconds    = retryAfter ? parseInt(retryAfter, 10) : 60
      const minutes    = Math.ceil(seconds / 60)
      const msg = seconds < 60
        ? `Demasiados intentos. Espera ${seconds} segundos.`
        : `Demasiados intentos. Espera ${minutes} minuto${minutes !== 1 ? 's' : ''}.`

      import('sonner').then(({ toast }) => toast.error(msg))
    }

    return Promise.reject(error)
  }
)

export default superadminApi
