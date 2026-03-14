'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardLayout({ children }) {
  const { user, organization, logout, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Cargando...</div>
      </div>
    )
  }

  const navigation = [
    { name: 'Dashboard',  href: '/dashboard',             icon: '📊' },
    { name: 'Citas',      href: '/dashboard/appointments', icon: '📅' },
    { name: 'Doctores',   href: '/dashboard/doctors',      icon: '👨‍⚕️' },
    { name: 'Pacientes',  href: '/dashboard/patients',     icon: '🐾' },
    { name: 'Propietarios', href: '/dashboard/owners',     icon: '👤' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">

        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 truncate w-40">
                {organization?.name || 'Clínica'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {organization?.clinic_type}
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-xs font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {organization?.name}
          </h1>
        </header>

        {/* Página */}
        <div className="flex-1 p-6">
          {children}
        </div>

      </main>

    </div>
  )
}