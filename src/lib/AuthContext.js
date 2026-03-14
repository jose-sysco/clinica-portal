'use client'

import { createContext, useContext, useState, useEffect } from "react"
import Cookies from "js-cookie"
import api from "./api"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [organization, setOrganization] = useState(null)
    const [loading, setLoading] = useState(true)

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
        } catch (error) {
            Cookies.remove('token')
            Cookies.remove('organization_slug')
        } finally {
            setLoading(false)
        }
    }

    const login = async (slug, email, password) => {
        const response = await api.post('/api/v1/auth/sign_in', {
            user: { email, password }
        }, {
            headers: { 'X-Organization-Slug': slug }
        })

        Cookies.set('token', response.data.token, { expires: 1 })
        Cookies.set('organization_slug', slug, { expires: 1 })

        setUser(response.data.user)
        await fetchMe()

        return response.data
    }

    const logout = async () => {
        try {
            await api.delete('/api/v1/auth/sign_out')
        } finally {
            Cookies.remove('token')
            Cookies.remove('organization_slug')
            setUser(null)
            setOrganization(null)
            window.location.href = '/login'
        }
    }

    return (
        <AuthContext.Provider value= {{ user, organization, loading, login, logout, fetchMe}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)