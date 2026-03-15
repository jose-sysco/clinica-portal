"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";

export default function MedicalRecordDetailPage() {
  const { id } = useParams();
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecord();
  }, []);

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/api/v1/medical_records/${id}`);
      setRecord(res.data);
    } catch (err) {
      setError("Error al cargar el expediente");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (datetime) => {
    if (!datetime) return "—";
    return new Date(datetime).toLocaleDateString("es-GT", {
      weekday: "long",
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
              Expediente clínico
            </h1>
            <p
              className="text-sm mt-0.5 capitalize"
              style={{ color: "#64748b" }}
            >
              {formatDate(record?.created_at)}
            </p>
          </div>
        </div>

        {/* Badge de expediente */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <span className="text-sm font-bold" style={{ color: "#2563eb" }}>
            Rx
          </span>
          <span className="text-xs" style={{ color: "#2563eb" }}>
            Expediente #{record?.id}
          </span>
        </div>
      </div>

      {/* Info de la consulta */}
      <div className="grid grid-cols-3 gap-5">
        {/* Doctor */}
        <div
          className="rounded-xl p-5 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#94a3b8" }}
          >
            Doctor
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#eff6ff" }}
            >
              <span className="text-sm font-bold" style={{ color: "#2563eb" }}>
                {record?.doctor?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
              {record?.doctor?.full_name}
            </p>
          </div>
        </div>

        {/* Paciente */}
        <div
          className="rounded-xl p-5 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#94a3b8" }}
          >
            {config.patientLabel}
          </p>
          <Link href={`/dashboard/patients/${record?.patient_id}/records`}>
            <p
              className="text-sm font-medium hover:underline"
              style={{ color: "#2563eb", cursor: "pointer" }}
            >
              Ver historial completo →
            </p>
          </Link>
        </div>

        {/* Próxima visita */}
        <div
          className="rounded-xl p-5 shadow-sm"
          style={{
            backgroundColor: record?.next_visit_date ? "#eff6ff" : "#ffffff",
            border: `1px solid ${record?.next_visit_date ? "#bfdbfe" : "#e2e8f0"}`,
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#94a3b8" }}
          >
            Próxima visita recomendada
          </p>
          <p
            className="text-sm font-medium capitalize"
            style={{ color: record?.next_visit_date ? "#2563eb" : "#94a3b8" }}
          >
            {record?.next_visit_date
              ? formatDate(record.next_visit_date)
              : "No programada"}
          </p>
        </div>
      </div>

      {/* Signos vitales */}
      {(record?.weight || record?.height || record?.temperature) && (
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#94a3b8" }}
          >
            Signos vitales
          </p>
          <div className="grid grid-cols-3 gap-4">
            {record?.weight && (
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Peso
                </p>
                <p className="text-3xl font-bold" style={{ color: "#0f172a" }}>
                  {record.weight}
                </p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  kilogramos
                </p>
              </div>
            )}
            {record?.height && (
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Talla
                </p>
                <p className="text-3xl font-bold" style={{ color: "#0f172a" }}>
                  {record.height}
                </p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  centímetros
                </p>
              </div>
            )}
            {record?.temperature && (
              <div
                className="rounded-xl p-4 text-center"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Temperatura
                </p>
                <p className="text-3xl font-bold" style={{ color: "#0f172a" }}>
                  {record.temperature}
                </p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  grados Celsius
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagnóstico y tratamiento */}
      <div className="grid grid-cols-2 gap-5">
        {record?.diagnosis && (
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#94a3b8" }}
            >
              Diagnóstico
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#0f172a" }}>
              {record.diagnosis}
            </p>
          </div>
        )}
        {record?.treatment && (
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#94a3b8" }}
            >
              Tratamiento
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#0f172a" }}>
              {record.treatment}
            </p>
          </div>
        )}
      </div>

      {/* Medicamentos */}
      {record?.medications && (
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#94a3b8" }}
          >
            Medicamentos recetados
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#0f172a" }}>
            {record.medications}
          </p>
        </div>
      )}

      {/* Notas */}
      {record?.notes && (
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#92400e" }}
          >
            Notas adicionales
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#78350f" }}>
            {record.notes}
          </p>
        </div>
      )}
    </div>
  );
}
