'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import Link from 'next/link'

export default function OwnerPatientsPage() {
  const { id } = useParams()

  const [owner, setOwner]     = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ownerRes, patientsRes] = await Promise.all([
        api.get(`/api/v1/owners/${id}`),
        api.get(`/api/v1/owners/${id}/patients`)
      ])
      setOwner(ownerRes.data)
      setPatients(patientsRes.data.data)
    } catch (err) {
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = {
    active:   { label: 'Activo',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    inactive: { label: 'Inactivo',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    deceased: { label: 'Fallecido', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/owners">
          <button
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#64748b', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
          >
            ← Volver
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
            {owner?.full_name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {owner?.phone} {owner?.email && `· ${owner?.email}`}
          </p>
        </div>
      </div>

      {/* Info del owner */}
      <div
        className="rounded-xl p-5 shadow-sm"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Teléfono</p>
            <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{owner?.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Email</p>
            <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{owner?.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Identificación</p>
            <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{owner?.identification || '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Dirección</p>
            <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{owner?.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Pacientes */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
          Responsable de {patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}
        </h2>
      </div>

      {patients.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
        >
          <p className="text-sm" style={{ color: '#94a3b8' }}>Este responsable no tiene pacientes registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {patients.map((patient) => {
            const status = statusLabel[patient.status] || statusLabel.active
            return (
              <div
                key={patient.id}
                className="rounded-xl p-6 shadow-sm"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#eff6ff' }}
                    >
                      <span className="text-sm font-semibold" style={{ color: '#2563eb' }}>
                        {patient.name?.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                        {patient.name}
                      </p>
                      <p className="text-xs" style={{ color: '#64748b' }}>
                        {patient.species || patient.patient_type}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ color: status.color, backgroundColor: status.bg, border: `1px solid ${status.border}` }}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="space-y-2">
                  {patient.breed && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#94a3b8' }}>Raza</span>
                      <span className="text-xs font-medium" style={{ color: '#0f172a' }}>{patient.breed}</span>
                    </div>
                  )}
                  {patient.gender && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#94a3b8' }}>Género</span>
                      <span className="text-xs font-medium" style={{ color: '#0f172a' }}>{patient.gender}</span>
                    </div>
                  )}
                  {patient.age !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#94a3b8' }}>Edad</span>
                      <span className="text-xs font-medium" style={{ color: '#0f172a' }}>{patient.age} años</span>
                    </div>
                  )}
                  {patient.weight && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: '#94a3b8' }}>Peso</span>
                      <span className="text-xs font-medium" style={{ color: '#0f172a' }}>{patient.weight} kg</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <Link href={`/dashboard/appointments/new?patient_id=${patient.id}&owner_id=${id}`}>
                    <button
                      className="w-full py-2 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    >
                      Agendar cita
                    </button>
                  </Link>
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}