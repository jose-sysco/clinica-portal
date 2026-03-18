"use client";

import { useState, useEffect } from "react";
import superadminApi from "@/lib/superadminApi";
import Link from "next/link";

const statusConfig = {
  active:    { label: "Activa",     color: "#22c55e", bg: "#14532d33", border: "#166534" },
  inactive:  { label: "Inactiva",   color: "#94a3b8", bg: "#1e293b",   border: "#334155" },
  suspended: { label: "Suspendida", color: "#ef4444", bg: "#450a0a33", border: "#7f1d1d" },
};

const planConfig = {
  trial:        { label: "Trial",        color: "#f59e0b" },
  basic:        { label: "Básico",       color: "#3b82f6" },
  professional: { label: "Profesional",  color: "#8b5cf6" },
  enterprise:   { label: "Empresarial",  color: "#06b6d4" },
};

const clinicTypeLabel = {
  veterinary: "Veterinaria",
  pediatric:  "Pediatría",
  general:    "Medicina General",
  dental:     "Odontología",
};

export default function SuperadminOrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ q: "", status: "", plan: "" });

  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => { fetchOrgs(); }, [page, filters]);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.q)      params.q      = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.plan)   params.plan   = filters.plan;
      const r = await superadminApi.get("/api/superadmin/organizations", { params });
      setOrgs(r.data.data);
      setPagination(r.data.pagination);
    } catch {}
    finally { setLoading(false); }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Organizaciones</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Gestión de clínicas registradas
          {pagination && <span style={{ color: "#475569" }}> — {pagination.count} en total</span>}
        </p>
      </div>

      {/* Filtros */}
      <div
        className="rounded-xl p-4 flex flex-wrap gap-3"
        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
      >
        <input
          type="text"
          placeholder="Buscar por nombre, email o slug..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="text-sm px-3 py-2 rounded-lg outline-none flex-1 min-w-48"
          style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="suspended">Suspendidas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <select
          value={filters.plan}
          onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
        >
          <option value="">Todos los planes</option>
          <option value="trial">Trial</option>
          <option value="basic">Básico</option>
          <option value="professional">Profesional</option>
          <option value="enterprise">Empresarial</option>
        </select>
        {(filters.q || filters.status || filters.plan) && (
          <button
            onClick={() => setFilters({ q: "", status: "", plan: "" })}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ backgroundColor: "#450a0a33", color: "#ef4444", border: "1px solid #7f1d1d" }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orgs.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        >
          <p className="text-sm" style={{ color: "#64748b" }}>No se encontraron organizaciones</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
                {["Organización", "Tipo", "Plan / Estado", "Trial", "Usuarios", "Citas", "Creada"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#475569" }}
                  >
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {orgs.map((org, i) => {
                const status = statusConfig[org.status] || statusConfig.active;
                const plan   = planConfig[org.plan]   || planConfig.trial;
                const trialExpired = org.trial_expired;
                return (
                  <tr
                    key={org.id}
                    style={{
                      backgroundColor: "#0f172a",
                      borderBottom: i < orgs.length - 1 ? "1px solid #1e293b" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{org.name}</p>
                      <p className="text-xs" style={{ color: "#475569" }}>{org.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        {clinicTypeLabel[org.clinic_type] || org.clinic_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
                          style={{ color: plan.color, backgroundColor: "#0f172a", border: `1px solid ${plan.color}33` }}
                        >
                          {plan.label}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full w-fit"
                          style={{ color: status.color, backgroundColor: status.bg, border: `1px solid ${status.border}` }}
                        >
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {org.on_trial ? (
                        <div>
                          {trialExpired ? (
                            <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>Vencido</span>
                          ) : (
                            <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                              {org.trial_days_remaining}d restantes
                            </span>
                          )}
                          <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                            vence {formatDate(org.trial_ends_at)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "#475569" }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{org.users_count}</p>
                      <p className="text-xs" style={{ color: "#475569" }}>{org.doctors_count} doctores</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: "#94a3b8" }}>{org.appointments_count}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs" style={{ color: "#475569" }}>{formatDate(org.created_at)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/superadmin/organizations/${org.id}`}>
                        <button
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#3b82f6", backgroundColor: "#1e3a5f33", border: "1px solid #1e3a5f" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e3a5f")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e3a5f33")}
                        >
                          Gestionar →
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginación */}
          {pagination && pagination.pages > 1 && (
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderTop: "1px solid #334155", backgroundColor: "#1e293b" }}
            >
              <p className="text-xs" style={{ color: "#475569" }}>
                Página {pagination.page} de {pagination.pages} — {pagination.count} orgs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={pagination.page === 1}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    border: "1px solid #334155",
                    backgroundColor: "#0f172a",
                    color: pagination.page === 1 ? "#334155" : "#94a3b8",
                    cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    border: "1px solid #334155",
                    backgroundColor: "#0f172a",
                    color: pagination.page === pagination.pages ? "#334155" : "#94a3b8",
                    cursor: pagination.page === pagination.pages ? "not-allowed" : "pointer",
                  }}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
