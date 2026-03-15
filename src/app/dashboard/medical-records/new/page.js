"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    appointment_id: appointmentId || "",
    weight: "",
    height: "",
    temperature: "",
    diagnosis: "",
    treatment: "",
    medications: "",
    notes: "",
    next_visit_date: "",
  });

  useEffect(() => {
    if (appointmentId) fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/api/v1/appointments/${appointmentId}`);
      setAppointment(res.data);
    } catch (err) {
      setError("Error al cargar la cita");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.diagnosis) {
      setError("El diagnóstico es requerido");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/v1/medical_records", { medical_record: form });
      toast.success("Expediente registrado correctamente");
      router.push("/dashboard/appointments");
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join(", "));
      } else {
        toast.error("Error al registrar el expediente");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/appointments">
          <button
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
            }}
          >
            ← Volver
          </button>
        </Link>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Registrar consulta
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Completa el expediente clínico de la consulta
          </p>
        </div>
      </div>

      {/* Info de la cita */}
      {appointment && (
        <div
          className="rounded-xl p-5 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#94a3b8" }}
          >
            Información de la cita
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                Paciente
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {appointment.patient?.name}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                Doctor
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {appointment.doctor?.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                Propietario
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {appointment.owner?.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>
                Motivo
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {appointment.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          {/* Columna izquierda — Signos vitales */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Signos vitales
            </p>

            <div>
              <label style={labelStyle}>Peso (lb)</label>
              <input
                type="number"
                step="0.01"
                value={form.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                placeholder="25.5"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Talla (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.height}
                onChange={(e) => handleChange("height", e.target.value)}
                placeholder="45.0"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                value={form.temperature}
                onChange={(e) => handleChange("temperature", e.target.value)}
                placeholder="38.5"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Próxima visita</label>
              <input
                type="date"
                value={form.next_visit_date}
                onChange={(e) =>
                  handleChange("next_visit_date", e.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* Columna derecha — Diagnóstico */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Diagnóstico y tratamiento
            </p>

            <div>
              <label style={labelStyle}>Diagnóstico *</label>
              <textarea
                value={form.diagnosis}
                onChange={(e) => handleChange("diagnosis", e.target.value)}
                placeholder="Diagnóstico de la consulta..."
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Tratamiento</label>
              <textarea
                value={form.treatment}
                onChange={(e) => handleChange("treatment", e.target.value)}
                placeholder="Tratamiento indicado..."
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Medicamentos</label>
              <textarea
                value={form.medications}
                onChange={(e) => handleChange("medications", e.target.value)}
                placeholder="Medicamentos recetados, dosis..."
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
          </div>
        </div>

        {/* Notas adicionales */}
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#94a3b8" }}
          >
            Notas adicionales
          </p>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Observaciones adicionales de la consulta..."
            rows={3}
            style={{ ...inputStyle, resize: "none" }}
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: submitting ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Guardando..." : "Guardar expediente"}
          </button>
          <Link href="/dashboard/appointments">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #e2e8f0",
              }}
            >
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
