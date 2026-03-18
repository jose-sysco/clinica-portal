"use client";

import { useState, useEffect } from "react";
import superadminApi from "@/lib/superadminApi";
import Link from "next/link";

const clinicTypeLabel = {
  veterinary: "Veterinaria",
  pediatric: "Pediatría",
  general: "Medicina General",
  dental: "Odontología",
};

const planLabel = {
  trial: "Prueba",
  basic: "Básico",
  professional: "Profesional",
  enterprise: "Empresarial",
};

export default function SuperadminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminApi
      .get("/api/superadmin/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const orgCards = [
    { label: "Total", value: stats?.organizations?.total, color: "#3b82f6", bg: "#1e3a5f" },
    { label: "Suscripción activa", value: stats?.organizations?.active_subscription, color: "#22c55e", bg: "#14532d" },
    { label: "En período de prueba", value: stats?.organizations?.on_trial, color: "#f59e0b", bg: "#451a03" },
    { label: "Trial vencido", value: stats?.organizations?.trial_expired, color: "#ef4444", bg: "#450a0a" },
    { label: "Suspendidas", value: stats?.organizations?.suspended, color: "#a855f7", bg: "#3b0764" },
    { label: "Nuevas este mes", value: stats?.organizations?.new_this_month, color: "#06b6d4", bg: "#0c4a6e" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Resumen global de la plataforma
          </p>
        </div>
        <Link href="/superadmin/organizations">
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
          >
            Ver organizaciones →
          </button>
        </Link>
      </div>

      {/* Org stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
          Organizaciones
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {orgCards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl p-4"
              style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
            >
              <p className="text-2xl font-bold mb-1" style={{ color: c.color }}>
                {c.value ?? "—"}
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {c.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Global counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
            Usuarios
          </p>
          <p className="text-3xl font-bold" style={{ color: "#f1f5f9" }}>
            {stats?.users?.total ?? "—"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>usuarios registrados en total</p>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
            Citas
          </p>
          <p className="text-3xl font-bold" style={{ color: "#f1f5f9" }}>
            {stats?.appointments?.this_month ?? "—"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
            este mes · {stats?.appointments?.total ?? "—"} en total
          </p>
        </div>
      </div>

      {/* Por tipo y plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>
            Por tipo de clínica
          </p>
          <div className="space-y-3">
            {Object.entries(stats?.by_clinic_type || {}).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#94a3b8" }}>
                  {clinicTypeLabel[type] || type}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>
            Por plan
          </p>
          <div className="space-y-3">
            {Object.entries(stats?.by_plan || {}).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "#94a3b8" }}>
                  {planLabel[plan] || plan}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
