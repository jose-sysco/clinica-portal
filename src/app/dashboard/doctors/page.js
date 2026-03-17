"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get("/api/v1/doctors");
      setDoctors(response.data.data);
    } catch (err) {
      setError("Error al cargar los doctores");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    active: {
      label: "Activo",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
    },
    inactive: {
      label: "Inactivo",
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
    },
    on_leave: {
      label: "De permiso",
      color: "#ea580c",
      bg: "#fff7ed",
      border: "#fed7aa",
    },
  };

  const dayLabel = {
    monday: "Lun",
    tuesday: "Mar",
    wednesday: "Mié",
    thursday: "Jue",
    friday: "Vie",
    saturday: "Sáb",
    sunday: "Dom",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Doctores
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {doctors.length} doctor{doctors.length !== 1 ? "es" : ""} registrado
            {doctors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/doctors/new">
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
            + Nuevo doctor
          </button>
        </Link>
      </div>

      {/* Cards */}
      {doctors.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            No hay doctores registrados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map((doctor) => {
            const status = statusConfig[doctor.status] || statusConfig.active;
            const activeDays =
              doctor.schedules?.filter((s) => s.is_active) || [];
            return (
              <div
                key={doctor.id}
                className="rounded-xl shadow-sm flex flex-col"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* Card header */}
                <div
                  className="p-5"
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#eff6ff" }}
                      >
                        <span
                          className="text-sm font-bold"
                          style={{ color: "#2563eb" }}
                        >
                          {doctor.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "#0f172a" }}
                        >
                          {doctor.full_name}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#64748b" }}
                        >
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        color: status.color,
                        backgroundColor: status.bg,
                        border: `1px solid ${status.border}`,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>
                      Email
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#0f172a" }}
                    >
                      {doctor.email}
                    </span>
                  </div>
                  {doctor.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        Teléfono
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {doctor.phone}
                      </span>
                    </div>
                  )}
                  {doctor.license_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        Cédula
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {doctor.license_number}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>
                      Duración consulta
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: "#0f172a" }}
                    >
                      {doctor.consultation_duration} min
                    </span>
                  </div>

                  {/* Días */}
                  <div>
                    <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>
                      Días de atención
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {activeDays.length > 0 ? (
                        activeDays.map((s) => (
                          <span
                            key={s.id}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                            }}
                          >
                            {dayLabel[s.day_of_week]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs" style={{ color: "#94a3b8" }}>
                          Sin horarios configurados
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card footer — acciones */}
                <div
                  className="grid grid-cols-3 gap-0"
                  style={{ borderTop: "1px solid #f1f5f9" }}
                >
                  <Link
                    href={`/dashboard/doctors/${doctor.id}/edit`}
                    className="flex-1"
                  >
                    <button
                      className="w-full py-3 text-xs font-medium transition-colors"
                      style={{ color: "#64748b" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      Editar
                    </button>
                  </Link>
                  <Link
                    href={`/dashboard/doctors/${doctor.id}/calendar`}
                    className="flex-1"
                  >
                    <button
                      className="w-full py-3 text-xs font-medium transition-colors"
                      style={{
                        color: "#7c3aed",
                        borderLeft: "1px solid #f1f5f9",
                        borderRight: "1px solid #f1f5f9",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#faf5ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      Calendario
                    </button>
                  </Link>
                  <Link
                    href={`/dashboard/doctors/${doctor.id}/availability`}
                    className="flex-1"
                  >
                    <button
                      className="w-full py-3 text-xs font-medium transition-colors"
                      style={{ color: "#2563eb" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#eff6ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      Disponibilidad
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
