"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function PatientRecordsPage() {
  const { id } = useParams();

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

  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString("es-GT", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Guatemala",
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
                {patient.name} · {patient.species || patient.patient_type}
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
                Propietario / Tutor
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {patient.owner?.full_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expedientes */}
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
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="rounded-xl p-6 shadow-sm"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* Header del expediente */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: "#2563eb" }}
                    >
                      Rx
                    </span>
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#0f172a" }}
                    >
                      Consulta del {formatDate(record.created_at)}
                    </p>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      Dr. {record.doctor?.full_name}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/medical-records/${record.id}`}>
                  <button
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{
                      color: "#2563eb",
                      backgroundColor: "#eff6ff",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    Ver detalle
                  </button>
                </Link>
              </div>

              {/* Signos vitales */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {record.weight && (
                  <div
                    className="rounded-lg p-3 text-center"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                      Peso
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "#0f172a" }}
                    >
                      {record.weight}
                    </p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      kg
                    </p>
                  </div>
                )}
                {record.height && (
                  <div
                    className="rounded-lg p-3 text-center"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                      Talla
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "#0f172a" }}
                    >
                      {record.height}
                    </p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      cm
                    </p>
                  </div>
                )}
                {record.temperature && (
                  <div
                    className="rounded-lg p-3 text-center"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                      Temperatura
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "#0f172a" }}
                    >
                      {record.temperature}
                    </p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      °C
                    </p>
                  </div>
                )}
              </div>

              {/* Diagnóstico y tratamiento */}
              <div className="grid grid-cols-2 gap-4">
                {record.diagnosis && (
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Diagnóstico
                    </p>
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {record.diagnosis}
                    </p>
                  </div>
                )}
                {record.treatment && (
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Tratamiento
                    </p>
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {record.treatment}
                    </p>
                  </div>
                )}
                {record.medications && (
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Medicamentos
                    </p>
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {record.medications}
                    </p>
                  </div>
                )}
                {record.next_visit_date && (
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#94a3b8" }}
                    >
                      Próxima visita
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#2563eb" }}
                    >
                      {formatDate(record.next_visit_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
