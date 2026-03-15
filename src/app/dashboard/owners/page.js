'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Link from 'next/link'

export default function OwnersPage(){
    const [owners, setOwners] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchOwners()
    }, [])

    const fetchOwners = async() => {
        try {
            const response = await api.get('/api/v1/owners')
            setOwners(response.data.data)
        } catch (err) {
            setError('Error al cargar los dueños')
        } finally {
            setLoading(false)
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
                        Dueños
                    </h1>
                    <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                        {owners.length} dueño{owners.length !== 1 ? 'es' : ''} registrado{owners.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Listado */}
            {owners.length === 0 ? (
                <div
                    className="rounded-xl p-12 text-center"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                >
                    <p className="text-sm" style={{ color: '#94a3b8' }}>No hay dueños registrados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {owners.map(owner => (
                        <div
                            key={owner.id}
                            className="rounded-xl flex flex-col justify-between p-5 shadow-sm transition-shadow hover:shadow-md"
                            style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
                                        <span className="text-xl">👤</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{owner.full_name}</p>
                                        <p className="text-xs" style={{ color: '#64748b' }}>{owner.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link href={`/dashboard/owners/${owner.id}/patients`}>
                                        <button
                                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                                            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                                        >
                                            Ver
                                        </button>
                                    </Link>
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm" style={{ color: '#64748b' }}>{owner.phone}</p>
                                <p className="text-sm" style={{ color: '#64748b' }}>{owner.address}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}