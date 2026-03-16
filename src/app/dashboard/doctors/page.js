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

  const statusLabel = {
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

      {/* Tabla */}
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
                  Doctor
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Contacto
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Especialidad
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Horarios
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Estado
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor, index) => {
                const status = statusLabel[doctor.status] || statusLabel.active;
                return (
                  <tr
                    key={doctor.id}
                    style={{
                      borderBottom:
                        index < doctors.length - 1
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
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#eff6ff" }}
                        >
                          <span
                            className="text-xs font-semibold"
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
                            className="text-sm font-medium"
                            style={{ color: "#0f172a" }}
                          >
                            {doctor.full_name}
                          </p>
                          {doctor.license_number && (
                            <p className="text-xs" style={{ color: "#94a3b8" }}>
                              Cédula: {doctor.license_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: "#0f172a" }}>
                        {doctor.email}
                      </p>
                      {doctor.phone && (
                        <p className="text-xs" style={{ color: "#94a3b8" }}>
                          {doctor.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: "#0f172a" }}>
                        {doctor.specialty}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {doctor.consultation_duration} min por consulta
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {doctor.schedules
                          ?.filter((s) => s.is_active)
                          .map((s) => (
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
                          ))}
                        {(!doctor.schedules ||
                          doctor.schedules.filter((s) => s.is_active).length ===
                            0) && (
                          <span
                            className="text-xs"
                            style={{ color: "#94a3b8" }}
                          >
                            Sin horarios
                          </span>
                        )}
                      </div>
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
                    <td className="px-6 py-4 text-right">
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/dashboard/doctors/${doctor.id}/edit`}>
                            <button
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{
                                color: "#64748b",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#f1f5f9")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#f8fafc")
                              }
                            >
                              Editar
                            </button>
                          </Link>
                          <Link
                            href={`/dashboard/doctors/${doctor.id}/availability`}
                          >
                            <button
                              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                              style={{
                                color: "#2563eb",
                                backgroundColor: "#eff6ff",
                                border: "1px solid #bfdbfe",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#dbeafe")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#eff6ff")
                              }
                            >
                              Ver disponibilidad
                            </button>
                          </Link>
                        </div>
                      </td>
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
