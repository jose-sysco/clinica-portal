"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import ExportCSVButton from "@/components/ExportCSVButton";
import { APPOINTMENTS_CSV, prepareAppointments } from "@/lib/exportCSV";
import { TableSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

const statusLabel = {
  pending: {
    label: "Pendiente",
    color: "#ea580c",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
  confirmed: {
    label: "Confirmada",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  in_progress: {
    label: "En progreso",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  completed: {
    label: "Completada",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
  cancelled: {
    label: "Cancelada",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  no_show: {
    label: "No asistió",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#e9d5ff",
  },
};

const typeLabel = {
  first_visit: "Primera visita",
  follow_up:   "Seguimiento",
  emergency:   "Urgencia",
  routine:     "Rutina",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    date: "",
    today: false,
  });

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    fetchAppointments();
  }, [filters, page]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;
      if (filters.today) params.today = "true";

      const response = await api.get("/api/v1/appointments", { params });
      setAppointments(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError("Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.patch(`/api/v1/appointments/${id}/confirm`);
      toast.success("Cita confirmada correctamente");
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al confirmar");
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("¿Estás seguro de cancelar esta cita?")) return;
    try {
      await api.patch(`/api/v1/appointments/${id}/cancel`, {
        cancelled_by: "cancelled_by_system",
        cancellation_reason: "Cancelado desde el portal",
      });
      toast.success("Cita cancelada correctamente");
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al cancelar");
    }
  };

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString("es-GT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Guatemala",
    });
  };

  const formatTime = (datetime) => datetime ? datetime.slice(11, 16) : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Citas
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gestión de citas médicas
            {pagination && (
              <span style={{ color: "#94a3b8" }}>
                {" "}
                — {pagination.count} en total
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVButton
            filename="citas"
            endpoint="/api/v1/appointments"
            params={{
              ...(filters.status && { status: filters.status }),
              ...(filters.date   && { date:   filters.date   }),
              ...(filters.today  && { today:  "true"         }),
            }}
            headers={APPOINTMENTS_CSV.headers}
            keys={APPOINTMENTS_CSV.keys}
            prepare={prepareAppointments}
          />
          <Link href="/dashboard/appointments/new">
            <button
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1d4ed8")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
            >
              + Nueva cita
            </button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div
        className="rounded-xl p-4 flex flex-wrap gap-3"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{
            border: "1px solid #e2e8f0",
            color: "#0f172a",
            backgroundColor: "#f8fafc",
          }}
        >
          <option value="">Todos los estados</option>
          {Object.entries(statusLabel).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date}
          onChange={(e) =>
            setFilters({ ...filters, date: e.target.value, today: false })
          }
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{
            border: "1px solid #e2e8f0",
            color: "#0f172a",
            backgroundColor: "#f8fafc",
          }}
        />

        <button
          onClick={() =>
            setFilters({ ...filters, today: !filters.today, date: "" })
          }
          className="text-sm px-3 py-2 rounded-lg transition-colors font-medium"
          style={{
            border: "1px solid #e2e8f0",
            backgroundColor: filters.today ? "#2563eb" : "#f8fafc",
            color: filters.today ? "#ffffff" : "#64748b",
          }}
        >
          Hoy
        </button>

        {(filters.status || filters.date || filters.today) && (
          <button
            onClick={() => setFilters({ status: "", date: "", today: false })}
            className="text-sm px-3 py-2 rounded-lg transition-colors"
            style={{
              border: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <TableSkeleton rows={7} cols={6} />
      ) : error ? (
        <div className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <EmptyState
            icon="calendar"
            title="Sin citas registradas"
            description={filters.status || filters.date || filters.today ? "No hay citas con los filtros aplicados. Prueba con otros criterios." : "Agenda tu primera cita para comenzar."}
            action={!filters.status && !filters.date && !filters.today ? "+ Nueva cita" : undefined}
            href="/dashboard/appointments/new"
          />
        </div>
      ) : (
        <div
          className="rounded-xl overflow-x-auto shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                {[
                  "Paciente",
                  "Doctor",
                  "Fecha y hora",
                  "Tipo",
                  "Estado",
                  "Acciones",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt, index) => {
                const status = statusLabel[apt.status] || statusLabel.pending;
                return (
                  <tr
                    key={apt.id}
                    style={{
                      borderBottom:
                        index < appointments.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                          {apt.patient?.name}
                        </p>
                        {apt.recurrence_group_id && (
                          <span
                            title={`Serie recurrente · Sesión ${apt.recurrence_index}/${apt.recurrence_total}`}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#faf5ff", color: "#7c3aed" }}
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {apt.owner?.full_name}
                        {apt.recurrence_group_id && (
                          <span style={{ color: "#a78bfa" }}> · {apt.recurrence_index}/{apt.recurrence_total}</span>
                        )}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: "#0f172a" }}>
                        {apt.doctor?.full_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {formatDate(apt.scheduled_at)}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {formatTime(apt.scheduled_at)} —{" "}
                        {formatTime(apt.ends_at)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs" style={{ color: "#64748b" }}>
                        {typeLabel[apt.appointment_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          color: status.color,
                          backgroundColor: status.bg,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/dashboard/appointments/${apt.id}`}>
                          <button
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: "#64748b", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                          >
                            Ver
                          </button>
                        </Link>
                        {apt.status === "pending" && (
                          <button
                            onClick={() => handleConfirm(apt.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                              color: "#16a34a",
                              backgroundColor: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#dcfce7")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#f0fdf4")
                            }
                          >
                            Confirmar
                          </button>
                        )}
                        {(apt.status === "pending" ||
                          apt.status === "confirmed") && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                              color: "#dc2626",
                              backgroundColor: "#fef2f2",
                              border: "1px solid #fecaca",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#fee2e2")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#fef2f2")
                            }
                          >
                            Cancelar
                          </button>
                        )}
                        {(apt.status === "confirmed" || apt.status === "in_progress") && (
                          <Link
                            href={`/dashboard/medical-records/new?appointment_id=${apt.id}`}
                          >
                            <button
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{
                                color: "#7c3aed",
                                backgroundColor: "#faf5ff",
                                border: "1px solid #e9d5ff",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#f3e8ff")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#faf5ff")
                              }
                            >
                              Registrar consulta
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Paginación */}
          {pagination && pagination.pages > 1 && (
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Página {pagination.page} de {pagination.pages} —{" "}
                {pagination.count} citas
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={pagination.page === 1}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    border: "1px solid #e2e8f0",
                    backgroundColor:
                      pagination.page === 1 ? "#f8fafc" : "#ffffff",
                    color: pagination.page === 1 ? "#cbd5e1" : "#64748b",
                    cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Anterior
                </button>

                {/* Números de página */}
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.pages ||
                      Math.abs(p - pagination.page) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`dots-${i}`}
                        className="text-xs"
                        style={{ color: "#94a3b8" }}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="text-xs font-medium w-8 h-8 rounded-lg transition-colors"
                        style={{
                          backgroundColor:
                            pagination.page === p ? "#2563eb" : "#ffffff",
                          color: pagination.page === p ? "#ffffff" : "#64748b",
                          border: `1px solid ${pagination.page === p ? "#2563eb" : "#e2e8f0"}`,
                        }}
                      >
                        {p}
                      </button>
                    ),
                  )}

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    border: "1px solid #e2e8f0",
                    backgroundColor:
                      pagination.page === pagination.pages
                        ? "#f8fafc"
                        : "#ffffff",
                    color:
                      pagination.page === pagination.pages
                        ? "#cbd5e1"
                        : "#64748b",
                    cursor:
                      pagination.page === pagination.pages
                        ? "not-allowed"
                        : "pointer",
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
