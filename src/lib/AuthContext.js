'use client'

import { createContext, useContext, useState, useEffect } from "react"
import Cookies from "js-cookie"
import api from "./api"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (token) {
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchMe = async () => {
    try {
      const response = await api.get('/api/v1/me')
      setUser(response.data)
      setOrganization(response.data.organization)
    } catch {
      // Si fetchMe falla (401 + refresh fallido), api.js ya limpió cookies
      // y redirigió a /login. Solo nos aseguramos de limpiar el estado.
      setUser(null)
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (slug, email, password) => {
    const response = await api.post('/api/v1/auth/sign_in',
      { user: { email, password } },
      { headers: { 'X-Organization-Slug': slug } }
    )

    const { token, refresh_token } = response.data

    const secure = window.location.protocol === "https:"
    const cookieOpts = (days) => ({ expires: days, secure, sameSite: "Strict" })

    // Access token: 1 hora (mismo que el JWT en el backend)
    Cookies.set('token',             token,         cookieOpts(1 / 24))
    // Refresh token: 30 días
    Cookies.set('refresh_token',     refresh_token, cookieOpts(30))
    Cookies.set('organization_slug', slug,          cookieOpts(30))

    setUser(response.data.user)
    setOrganization(response.data.organization)

    return response.data
  }

  const logout = async (currentUser) => {
    const isSuperadmin = (currentUser || user)?.role === 'superadmin'
    try {
      await api.delete('/api/v1/auth/sign_out', {
        data: { refresh_token: Cookies.get('refresh_token') }
      })
    } finally {
      Cookies.remove('token')
      Cookies.remove('refresh_token')
      Cookies.remove('organization_slug')
      setUser(null)
      setOrganization(null)
      window.location.href = isSuperadmin ? '/superadmin/login' : '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
