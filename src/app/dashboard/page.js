'use client'

import { useAuth } from '@/lib/AuthContext'

export default function DashboardPage() {
  const { user, organization } = useAuth()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Bienvenido, {user?.first_name} 👋
      </h2>
      <p className="text-gray-500 mb-8">
        {organization?.name} — Panel de administración
      </p>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Citas hoy"        value="—" icon="📅" color="blue"   />
        <StatCard title="Doctores activos" value="—" icon="👨‍⚕️" color="green"  />
        <StatCard title="Pacientes"        value="—" icon="🐾" color="purple" />
        <StatCard title="Propietarios"     value="—" icon="👤" color="orange" />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors[color]}`}>
          {title}
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
    </div>
  )
}