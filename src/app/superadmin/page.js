"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import superadminApi from "@/lib/superadminApi";
import Link from "next/link";

const clinicTypeLabel = {
  veterinary:    "Veterinaria",
  pediatric:     "Pediatría",
  general:       "Medicina General",
  dental:        "Odontología",
  psychology:    "Psicología",
  physiotherapy: "Fisioterapia",
  nutrition:     "Nutrición",
  beauty:        "Estética y Belleza",
  coaching:      "Coaching",
  legal:         "Servicios Legales",
  fitness:       "Fitness y Deporte",
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

function Trend({ current, previous }) {
  if (previous === undefined || previous === null) return null;
  const diff = current - previous;
  const up   = diff >= 0;
  return (
    <span className="text-xs ml-1" style={{ color: up ? "#22c55e" : "#ef4444" }}>
      {up ? "▲" : "▼"} {Math.abs(diff)} vs mes anterior
    </span>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-GT", {
    day: "numeric", month: "short", year: "numeric", timeZone: "America/Guatemala",
  });
}

// ─── Fila de acción pendiente ─────────────────────────────────────────────────
function ActionRow({ org, badge, badgeColor, extra }) {
  const router = useRouter();
  return (
    <div
      className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
      style={{ backgroundColor: "#0f172a" }}
      onClick={() => router.push(`/superadmin/organizations/${org.id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" style={{ color: "#f1f5f9" }}>{org.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {org.email && (
              <a href={`mailto:${org.email}`} onClick={(e) => e.stopPropagation()}
                className="text-xs hover:underline" style={{ color: "#475569" }}>
                {org.email}
              </a>
            )}
            {org.phone && (
              <a href={`tel:${org.phone}`} onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium hover:underline" style={{ color: "#3b82f6" }}>
                {org.phone}
              </a>
            )}
          </div>
        </div>
        {extra && <span className="text-xs shrink-0" style={{ color: "#64748b" }}>{extra}</span>}
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full ml-4 shrink-0"
        style={{ backgroundColor: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44` }}>
        {badge}
      </span>
    </div>
  );
}

// ─── Bloque de acción ─────────────────────────────────────────────────────────
function ActionBlock({ title, count, color, emptyText, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}33` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
        style={{ backgroundColor: `${color}11` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold" style={{ color }}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}33`, color }}>
              {count}
            </span>
          )}
          <span className="text-xs" style={{ color }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="divide-y" style={{ borderColor: "#1e293b" }}>
          {count === 0 ? (
            <p className="px-5 py-4 text-xs" style={{ color: "#475569", backgroundColor: "#0f172a" }}>
              {emptyText}
            </p>
          ) : children}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SuperadminDashboard() {
  const [stats,   setStats]   = useState(null);
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

  const o       = stats?.organizations       || {};
  const a       = stats?.appointments        || {};
  const expiring = stats?.expiring_soon      || [];
  const suspended = stats?.suspended_orgs    || [];
  const unpaid    = stats?.unpaid_this_month || { count: 0, orgs: [] };

  const totalPending = expiring.length + suspended.length + unpaid.count;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Resumen global de la plataforma</p>
        </div>
        <Link href="/superadmin/organizations">
          <button className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
            Ver organizaciones →
          </button>
        </Link>
      </div>

      {/* ── PANEL: Acciones pendientes ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
            Acciones pendientes
          </p>
          {totalPending > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#ef444422", color: "#ef4444", border: "1px solid #ef444433" }}>
              {totalPending}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Trials que vencen esta semana */}
          <ActionBlock
            title="Trials que vencen en 7 días"
            count={expiring.length}
            color="#f59e0b"
            emptyText="Sin trials por vencer esta semana."
          >
            {expiring.map((org) => (
              <ActionRow key={org.id} org={org}
                badge={org.trial_days_remaining === 1 ? "1 día" : `${org.trial_days_remaining} días`}
                badgeColor="#f59e0b"
                extra={`vence ${formatDate(org.trial_ends_at)}`}
              />
            ))}
          </ActionBlock>

          {/* Sin pago este mes */}
          <ActionBlock
            title={`Sin pago este mes (${new Date().toLocaleDateString("es-GT", { month: "long", year: "numeric" })})`}
            count={unpaid.count}
            color="#3b82f6"
            emptyText="Todos los clientes han pagado este mes."
          >
            {unpaid.orgs.map((org) => (
              <ActionRow key={org.id} org={org}
                badge={planLabel[org.plan] || org.plan}
                badgeColor={planColor[org.plan] || "#64748b"}
              />
            ))}
          </ActionBlock>

          {/* Suspendidas */}
          <ActionBlock
            title="Organizaciones suspendidas"
            count={suspended.length}
            color="#ef4444"
            emptyText="Sin organizaciones suspendidas."
          >
            {suspended.map((org) => (
              <ActionRow key={org.id} org={org}
                badge="Suspendida"
                badgeColor="#ef4444"
                extra={org.suspended_at ? `desde ${formatDate(org.suspended_at)}` : undefined}
              />
            ))}
          </ActionBlock>
        </div>
      </div>

      {/* ── KPIs organizaciones ───────────────────────────────────────────── */}
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

      {/* ── Citas + Usuarios ──────────────────────────────────────────────── */}
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

      {/* ── Por tipo y plan ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>
            Por tipo de clínica
          </p>
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
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>
            Por plan
          </p>
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
                    <div className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: planColor[plan] || "#64748b" }} />
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
