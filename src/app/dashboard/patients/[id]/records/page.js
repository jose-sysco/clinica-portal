"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";

export default function PatientRecordsPage() {
  const { id } = useParams();
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [records, setRecords] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientRes, recordsRes] = await Promise.all([
        api.get(`/api/v1/patients/${id}`),
        api.get(`/api/v1/patients/${id}/medical_records`),
      ]);
      setPatient(patientRes.data);
      setRecords(recordsRes.data);
    } catch (err) {
      setError("Error al cargar el historial");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    // date-only strings (YYYY-MM-DD) must be parsed as local date to avoid
    // UTC midnight → previous day offset in Guatemala (UTC-6)
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("es-GT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
            }}
          >
            ← Volver
          </button>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#0f172a" }}
            >
              Historial clínico
            </h1>
            {patient && (
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                {patient.name} ·{" "}
                {patient.patient_type === "animal"
                  ? patient.species
                  : patient.gender === "male"
                    ? "Masculino"
                    : patient.gender === "female"
                      ? "Femenino"
                      : "—"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info del paciente */}
      {patient && (
        <div
          className="rounded-xl p-5 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                Nombre
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {patient.name}
              </p>
            </div>
            {patient.patient_type === "animal" ? (
              <>
                <div>
                  <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                    Especie
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#0f172a" }}
                  >
                    {patient.species || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                    Raza
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#0f172a" }}
                  >
                    {patient.breed || "—"}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Género
                </p>
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                  {patient.gender === "male"
                    ? "Masculino"
                    : patient.gender === "female"
                      ? "Femenino"
                      : "—"}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                Edad
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {patient.age ? `${patient.age} años` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                {config.ownerLabel}
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {patient.owner?.full_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de consultas */}
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "#94a3b8" }}
        >
          {records.length} consulta{records.length !== 1 ? "s" : ""} registrada
          {records.length !== 1 ? "s" : ""}
        </h2>
      </div>

      {records.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "#0f172a" }}>
            Sin historial clínico
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Los expedientes se crean al completar una cita
          </p>
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
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Fecha
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  {config.staffSingularLabel}
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Evaluación / Diagnóstico
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Vitales
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Próxima visita
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr
                  key={record.id}
                  style={{
                    borderBottom:
                      index < records.length - 1 ? "1px solid #f1f5f9" : "none",
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
                      {formatDate(record.created_at)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {record.doctor?.full_name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const text = record.soap_assessment || record.diagnosis || "";
                      return (
                        <p className="text-sm" style={{ color: "#0f172a" }}>
                          {text.length > 60 ? `${text.slice(0, 60)}...` : text || "—"}
                        </p>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {record.weight      && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{record.weight} lb</span>}
                      {record.temperature && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{record.temperature}°C</span>}
                      {record.heart_rate  && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{record.heart_rate} ppm</span>}
                      {record.blood_pressure_systolic && record.blood_pressure_diastolic && (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {record.blood_pressure_systolic}/{record.blood_pressure_diastolic} mmHg
                        </span>
                      )}
                      {record.oxygen_saturation && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{record.oxygen_saturation}% SpO₂</span>}
                      {!record.weight && !record.temperature && !record.heart_rate && !record.oxygen_saturation && (
                        <span className="text-xs" style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {record.next_visit_date ? (
                      <span
                        className="text-xs font-medium"
                        style={{ color: "#2563eb" }}
                      >
                        {formatDate(record.next_visit_date)}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/medical-records/${record.id}`}>
                      <button
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                          color: "#2563eb",
                          backgroundColor: "#eff6ff",
                          border: "1px solid #bfdbfe",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#dbeafe")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#eff6ff")
                        }
                      >
                        Ver detalle
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
