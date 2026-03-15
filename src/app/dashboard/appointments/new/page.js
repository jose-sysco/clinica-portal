"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [owners, setOwners] = useState([]);
  const [patients, setPatients] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    doctor_id: searchParams.get("doctor_id") || "",
    owner_id: searchParams.get("owner_id") || "",
    patient_id: searchParams.get("patient_id") || "",
    date: searchParams.get("date") || new Date().toISOString().split("T")[0],
    time: searchParams.get("time") || "",
    appointment_type: "first_visit",
    reason: "",
  });

  useEffect(() => {
    fetchDoctors();
    fetchOwners();
  }, []);

  useEffect(() => {
    if (form.doctor_id && form.date) fetchSlots();
  }, [form.doctor_id, form.date]);

  useEffect(() => {
    if (form.owner_id) {
      fetchPatients(form.owner_id);
    } else {
      setPatients([]);
      setForm((f) => ({ ...f, patient_id: "" }));
    }
  }, [form.owner_id]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/api/v1/doctors");
      setDoctors(res.data.data.filter((d) => d.status === "active"));
    } catch (err) {}
  };

  const fetchOwners = async () => {
    try {
      const res = await api.get("/api/v1/owners");
      setOwners(res.data.data);
    } catch (err) {}
  };

  const fetchPatients = async (ownerId) => {
    try {
      const res = await api.get(`/api/v1/owners/${ownerId}/patients`);
      setPatients(res.data.data.filter((p) => p.status === "active"));
    } catch (err) {}
  };

  const fetchSlots = async () => {
    setLoading(true);
    setSlots([]);
    setForm((f) => ({ ...f, time: "" }));
    try {
      const res = await api.get(
        `/api/v1/doctors/${form.doctor_id}/availability`,
        {
          params: { date: form.date },
        },
      );
      setSlots(res.data.slots);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !form.doctor_id ||
      !form.patient_id ||
      !form.owner_id ||
      !form.time ||
      !form.reason
    ) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/v1/appointments", {
        appointment: {
          doctor_id: parseInt(form.doctor_id),
          patient_id: parseInt(form.patient_id),
          owner_id: parseInt(form.owner_id),
          scheduled_at: `${form.date}T${form.time}:00`,
          appointment_type: form.appointment_type,
          reason: form.reason,
        },
      });
      router.push("/dashboard/appointments");
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Error al crear la cita");
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

  return (
    <div className="h-full space-y-5">
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
            Nueva cita
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Completa los datos para agendar
          </p>
        </div>
      </div>

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

      {/* Formulario en dos columnas */}
      <form onSubmit={handleSubmit} className="h-full">
        <div className="grid grid-cols-2 gap-5">
          {/* Columna izquierda */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Médico y horario
            </p>

            {/* Doctor */}
            <div>
              <label style={labelStyle}>Doctor *</label>
              <select
                value={form.doctor_id}
                onChange={(e) => handleChange("doctor_id", e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">Selecciona un doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} — {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleChange("date", e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            {/* Slots */}
            <div>
              <label style={labelStyle}>Horario disponible *</label>
              {!form.doctor_id ? (
                <p className="text-sm py-2" style={{ color: "#94a3b8" }}>
                  Selecciona un doctor primero
                </p>
              ) : loading ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm" style={{ color: "#64748b" }}>
                    Cargando horarios...
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm py-2" style={{ color: "#94a3b8" }}>
                  No hay horarios disponibles
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChange("time", slot.starts_at)}
                      className="py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor:
                          form.time === slot.starts_at ? "#2563eb" : "#eff6ff",
                        color:
                          form.time === slot.starts_at ? "#ffffff" : "#2563eb",
                        border: `1px solid ${form.time === slot.starts_at ? "#2563eb" : "#bfdbfe"}`,
                      }}
                    >
                      {slot.starts_at}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Paciente y motivo
            </p>

            {/* Propietario */}
            <div>
              <label style={labelStyle}>Propietario / Tutor *</label>
              <select
                value={form.owner_id}
                onChange={(e) => handleChange("owner_id", e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">Selecciona un propietario</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name} {o.phone ? `— ${o.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Paciente */}
            <div>
              <label style={labelStyle}>Paciente *</label>
              <select
                value={form.patient_id}
                onChange={(e) => handleChange("patient_id", e.target.value)}
                style={inputStyle}
                disabled={!form.owner_id}
                required
              >
                <option value="">
                  {form.owner_id
                    ? "Selecciona un paciente"
                    : "Primero selecciona un propietario"}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.species ? `— ${p.species}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label style={labelStyle}>Tipo de consulta *</label>
              <select
                value={form.appointment_type}
                onChange={(e) =>
                  handleChange("appointment_type", e.target.value)
                }
                style={inputStyle}
                required
              >
                <option value="first_visit">Primera visita</option>
                <option value="follow_up">Seguimiento</option>
                <option value="emergency">Emergencia</option>
                <option value="routine">Rutina</option>
              </select>
            </div>

            {/* Motivo */}
            <div>
              <label style={labelStyle}>Motivo de consulta *</label>
              <textarea
                value={form.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Describe el motivo de la consulta..."
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
                required
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: submitting ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Creando cita..." : "Crear cita"}
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
          </div>
        </div>
      </form>
    </div>
  );
}
