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
      </div>

      {/* Lista */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doctor) => {
            const status = statusLabel[doctor.status] || statusLabel.active;
            return (
              <div
                key={doctor.id}
                className="rounded-xl p-6 shadow-sm"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* Header del card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#eff6ff" }}
                    >
                      <span
                        className="text-sm font-semibold"
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
                      <p className="text-xs" style={{ color: "#64748b" }}>
                        {doctor.specialty}
                      </p>
                    </div>
                  </div>
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
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
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
                </div>

                {/* Horarios */}
                {doctor.schedules && doctor.schedules.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>
                      Días de atención
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {doctor.schedules
                        .filter((s) => s.is_active)
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
                    </div>
                  </div>
                )}

                {/* Acción */}
                <Link href={`/dashboard/doctors/${doctor.id}/availability`}>
                  <button
                    className="w-full py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#dbeafe")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#eff6ff")
                    }
                  >
                    Ver disponibilidad
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
