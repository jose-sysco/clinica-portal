"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

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
  follow_up: "Seguimiento",
  emergency: "Emergencia",
  routine: "Rutina",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    date: "",
    today: false,
  });

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;
      if (filters.today) params.today = "true";

      const response = await api.get("/api/v1/appointments", { params });
      setAppointments(response.data.data);
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

  const formatTime = (datetime) => {
    return datetime.substring(11, 16);
  };

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
          </p>
        </div>
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
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "#0f172a" }}>
            No hay citas
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            No se encontraron citas con los filtros aplicados
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden shadow-sm"
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
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Paciente
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Doctor
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Fecha y hora
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Tipo
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Estado
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Acciones
                </th>
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
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {apt.patient?.name}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {apt.owner?.full_name}
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
                        {apt.status === "confirmed" && (
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
        </div>
      )}
    </div>
  );
}
