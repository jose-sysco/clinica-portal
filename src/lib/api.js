import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// ── Request interceptor ───────────────────────────────────────────────────────
// Adjunta token de acceso y slug a cada request automáticamente

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  const slug  = Cookies.get('organization_slug')

  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (slug)  config.headers['X-Organization-Slug'] = slug

  return config
})

// ── Refresh logic ─────────────────────────────────────────────────────────────
// Maneja renovación silenciosa de tokens y cola de requests concurrentes

let isRefreshing  = false
let failedQueue   = []   // requests que llegaron mientras se estaba renovando

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
  window.location.href = '/login'
}

const attemptRefresh = async () => {
  const rawRefresh = Cookies.get('refresh_token')
  const slug       = Cookies.get('organization_slug')

  if (!rawRefresh) throw new Error('no_refresh_token')

  // Usamos axios directamente para evitar el interceptor response (loop infinito)
  const response = await axios.post(
    `${API_URL}/api/v1/auth/refresh`,
    { refresh_token: rawRefresh },
    { headers: { 'X-Organization-Slug': slug, 'Content-Type': 'application/json' } }
  )

  const { token, refresh_token: newRefresh } = response.data

  Cookies.set('token', token,       { expires: 1 / 24 })   // 1 hora
  Cookies.set('refresh_token', newRefresh, { expires: 30 }) // 30 días

  return token
}

// ── Response interceptor ──────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // ── 401: intentar renovar token ────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {

      // Si ya hay un refresh en curso, encolar este request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await attemptRefresh()

        // Actualizar header por defecto y despachar requests en cola
        api.defaults.headers['Authorization'] = `Bearer ${newToken}`
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        processQueue(null, newToken)

        return api(originalRequest)

      } catch (refreshError) {
        processQueue(refreshError, null)
        clearSession()
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    // ── 402: licencia suspendida o trial vencido ──────────────────────────
    if (error.response?.status === 402) {
      const code = error.response?.data?.code
      if (code === 'license_suspended') {
        window.location.href = '/subscription-required?reason=license_suspended'
      } else if (code === 'trial_expired') {
        import('sonner').then(({ toast }) =>
          toast.error('Tu período de prueba ha expirado. Adquiere una suscripción para continuar.')
        )
      }
    }

    // ── 429: rate limited ─────────────────────────────────────────────────
    if (error.response?.status === 429) {
      const retryAfter = error.response?.headers?.['retry-after']
      const seconds    = retryAfter ? parseInt(retryAfter, 10) : 60
      const minutes    = Math.ceil(seconds / 60)
      const msg = seconds < 60
        ? `Demasiados intentos. Espera ${seconds} segundos.`
        : `Demasiados intentos. Espera ${minutes} minuto${minutes !== 1 ? 's' : ''}.`

      // Importamos toast dinámicamente para no depender del módulo en este archivo
      import('sonner').then(({ toast }) => toast.error(msg))
    }

    return Promise.reject(error)
  }
)

export default api
