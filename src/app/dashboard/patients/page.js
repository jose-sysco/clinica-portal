"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";

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
  deceased: {
    label: "Fallecido",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
};

export default function PatientsPage() {
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (q = "") => {
    setLoading(true);
    try {
      const params = q ? { q } : {};
      const response = await api.get("/api/v1/patients", { params });
      setPatients(response.data.data);
    } catch (err) {
      setError(`Error al cargar los ${config.patientsLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length === 0 || value.length >= 3) fetchPatients(value);
  };

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
            {config.patientsLabel}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {patients.length}{" "}
            {patients.length === 1
              ? config.patientLabel.toLowerCase()
              : config.patientsLabel.toLowerCase()}{" "}
            registrado{patients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/patients/new">
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
            + Nuevo {config.patientLabel.toLowerCase()}
          </button>
        </Link>
      </div>

      {/* Búsqueda */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder={`Buscar ${config.patientLabel.toLowerCase()} por nombre...`}
          className="w-full text-sm outline-none"
          style={{ color: "#0f172a" }}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            No se encontraron {config.patientsLabel.toLowerCase()}
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
                  {config.patientLabel}
                </th>
                {config.requiresOwner && (
                  <th
                    className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#64748b" }}
                  >
                    {config.ownerLabel}
                  </th>
                )}
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Detalles
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
              {patients.map((patient, index) => {
                const status =
                  statusLabel[patient.status] || statusLabel.active;
                return (
                  <tr
                    key={patient.id}
                    style={{
                      borderBottom:
                        index < patients.length - 1
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
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#eff6ff" }}
                        >
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "#2563eb" }}
                          >
                            {patient.name?.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#0f172a" }}
                          >
                            {patient.name}
                          </p>
                          {config.showSpecies && patient.species && (
                            <p className="text-xs" style={{ color: "#94a3b8" }}>
                              {patient.species}
                              {patient.breed ? ` · ${patient.breed}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {config.requiresOwner && (
                      <td className="px-6 py-4">
                        <p className="text-sm" style={{ color: "#0f172a" }}>
                          {patient.owner?.full_name}
                        </p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>
                          {patient.owner?.phone}
                        </p>
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {patient.age !== null && (
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            {patient.age} año{patient.age !== 1 ? "s" : ""}
                          </p>
                        )}
                        {patient.weight && (
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            {patient.weight} kg
                          </p>
                        )}
                        {patient.gender && (
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            {patient.gender === "male"
                              ? config.showAnimalGender
                                ? "Macho"
                                : "Masculino"
                              : patient.gender === "female"
                                ? config.showAnimalGender
                                  ? "Hembra"
                                  : "Femenino"
                                : "N/A"}
                          </p>
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
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/dashboard/patients/${patient.id}/records`}
                        >
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
                            Historial
                          </button>
                        </Link>
                        <Link
                          href={`/dashboard/appointments/new?patient_id=${patient.id}&owner_id=${patient.owner?.id}`}
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
                            Agendar cita
                          </button>
                        </Link>
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
