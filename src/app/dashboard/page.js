'use client'

import { useAuth } from '@/lib/AuthContext'

export default function DashboardPage() {
  const { user, organization } = useAuth()

  const stats = [
    { title: 'Citas hoy',        value: '—', description: 'Programadas para hoy',      accent: '#2563eb', light: '#eff6ff' },
    { title: 'Doctores activos', value: '—', description: 'Personal disponible',        accent: '#16a34a', light: '#f0fdf4' },
    { title: 'Pacientes',        value: '—', description: 'Total en el sistema',        accent: '#7c3aed', light: '#faf5ff' },
    { title: 'Propietarios',     value: '—', description: 'Tutores registrados',        accent: '#ea580c', light: '#fff7ed' },
  ]

  const quickActions = [
    { title: 'Nueva cita',         description: 'Agenda una cita para un paciente',   href: '/dashboard/appointments/new' },
    { title: 'Registrar paciente', description: 'Agrega un nuevo paciente al sistema', href: '/dashboard/patients/new'     },
    { title: 'Ver disponibilidad', description: 'Consulta horarios de doctores',       href: '/dashboard/doctors'          },
  ]

  return (
    <div className="space-y-8">

      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
          Bienvenido, {user?.first_name} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>
          Resumen de actividad — {organization?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: '#64748b' }}>{stat.title}</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.light }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stat.accent }}
                />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight mb-1" style={{ color: stat.accent }}>
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: '#94a3b8' }}
        >
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <a key={action.title} href={action.href}>
              <div
                className="rounded-xl p-5 shadow-sm transition-all cursor-pointer"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#2563eb'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: '#0f172a' }}>
                  {action.title}
                </p>
                <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
                  {action.description}
                </p>
                <p className="text-xs font-medium" style={{ color: '#2563eb' }}>
                  Ir al módulo →
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}