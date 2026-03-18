"use client";

import { useState, useEffect } from "react";
import superadminApi from "@/lib/superadminApi";
import Link from "next/link";

const clinicTypeLabel = {
  veterinary: "Veterinaria",
  pediatric:  "Pediatría",
  general:    "Medicina General",
  dental:     "Odontología",
  psychology: "Psicología",
};

const planLabel = {
  trial:        "Trial",
  basic:        "Básico",
  professional: "Profesional",
  enterprise:   "Empresarial",
};

const planColor = {
  trial:        "#f59e0b",
  basic:        "#3b82f6",
  professional: "#8b5cf6",
  enterprise:   "#06b6d4",
};

function StatCard({ label, value, color, sub }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
      <p className="text-2xl font-bold mb-0.5" style={{ color: color || "#f1f5f9" }}>{value ?? "—"}</p>
      <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#475569" }}>{sub}</p>}
    </div>
  );
}

function Trend({ current, previous, label }) {
  if (previous === undefined || previous === null) return null;
  const diff = current - previous;
  const up = diff >= 0;
  return (
    <span className="text-xs ml-1" style={{ color: up ? "#22c55e" : "#ef4444" }}>
      {up ? "▲" : "▼"} {Math.abs(diff)} vs mes anterior
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-GT", {
    day: "numeric", month: "short", year: "numeric", timeZone: "America/Guatemala"
  });
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminApi.get("/api/superadmin/dashboard/stats")
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

  const o = stats?.organizations || {};
  const a = stats?.appointments  || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Resumen global de la plataforma</p>
        </div>
        <Link href="/superadmin/organizations">
          <button className="text-sm font-medium px-4 py-2 rounded-lg" style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
            Ver organizaciones →
          </button>
        </Link>
      </div>

      {/* Alerta: vencen pronto */}
      {stats?.expiring_soon?.length > 0 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: "#451a0322", border: "1px solid #f59e0b55" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">⚠️</span>
            <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
              {stats.expiring_soon.length} {stats.expiring_soon.length === 1 ? "organización vence" : "organizaciones vencen"} en los próximos 7 días
            </p>
          </div>
          <div className="space-y-2">
            {stats.expiring_soon.map((org) => (
              <Link key={org.id} href={`/superadmin/organizations/${org.id}`}>
                <div
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                  style={{ backgroundColor: "#1e293b" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#334155")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                >
                  <div>
                    <span className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{org.name}</span>
                    <span className="text-xs ml-2" style={{ color: "#64748b" }}>{org.email}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44" }}
                  >
                    {org.trial_days_remaining === 1 ? "1 día" : `${org.trial_days_remaining} días`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Org stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
          Organizaciones
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <StatCard label="Total"              value={o.total}               color="#f1f5f9" />
          <StatCard label="Con suscripción"    value={o.active_subscription} color="#22c55e" />
          <StatCard label="En trial"           value={o.on_trial}            color="#f59e0b" />
          <StatCard label="Trial vencido"      value={o.trial_expired}       color="#ef4444" />
          <StatCard label="Suspendidas"        value={o.suspended}           color="#a855f7" />
          <StatCard label="Vencen en 7 días"   value={o.expiring_soon}       color="#fb923c" />
          <StatCard
            label="Nuevas este mes"
            value={o.new_this_month}
            color="#38bdf8"
            sub={o.new_last_month !== undefined ? `${o.new_last_month} el mes pasado` : undefined}
          />
        </div>
      </div>

      {/* Citas + usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Citas</p>
          <div className="flex items-end gap-3 mb-1">
            <p className="text-3xl font-bold" style={{ color: "#f1f5f9" }}>{a.this_month ?? "—"}</p>
            <Trend current={a.this_month} previous={a.last_month} />
          </div>
          <p className="text-xs" style={{ color: "#64748b" }}>este mes · {a.total ?? "—"} en total</p>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Usuarios</p>
          <p className="text-3xl font-bold mb-1" style={{ color: "#f1f5f9" }}>{stats?.users?.total ?? "—"}</p>
          <p className="text-xs" style={{ color: "#64748b" }}>
            usuarios en clínicas · {stats?.users?.superadmins ?? "—"} administradores del sistema
          </p>
        </div>
      </div>

      {/* Por tipo y plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Por tipo de clínica</p>
          <div className="space-y-3">
            {Object.entries(stats?.by_clinic_type || {}).map(([type, count]) => {
              const total = stats?.organizations?.total || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{clinicTypeLabel[type] || type}</span>
                    <span className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: "#334155" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: "#3b82f6" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>Por plan</p>
          <div className="space-y-3">
            {Object.entries(stats?.by_plan || {}).map(([plan, count]) => {
              const total = stats?.organizations?.total || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={plan}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{planLabel[plan] || plan}</span>
                    <span className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: "#334155" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: planColor[plan] || "#64748b" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
