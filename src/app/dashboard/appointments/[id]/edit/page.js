"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "first_visit", label: "Primera visita" },
  { value: "follow_up",   label: "Seguimiento" },
  { value: "emergency",   label: "Urgencia" },
  { value: "routine",     label: "Rutina" },
];

function toLocalDatetime(iso) {
  if (!iso) return "";
  // iso comes from API as "2026-03-19T10:00:00" (already in org timezone from server)
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

export default function AppointmentEditPage() {
  const { id }     = useParams();
  const router     = useRouter();
  const { organization } = useAuth();
  const config     = getConfig(organization?.clinic_type);

  const [appt,      setAppt]      = useState(null);
  const [doctors,   setDoctors]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({
    doctor_id:        "",
    scheduled_at:     "",
    ends_at:          "",
    appointment_type: "",
    reason:           "",
    notes:            "",
  });

  useEffect(() => {
    Promise.all([
      api.get(`/api/v1/appointments/${id}`),
      api.get("/api/v1/doctors", { params: { per_page: 200 } }),
    ])
      .then(([apptRes, docsRes]) => {
        const a = apptRes.data;
        setAppt(a);
        setDoctors(docsRes.data.data || []);
        setForm({
          doctor_id:        a.doctor?.id || "",
          scheduled_at:     toLocalDatetime(a.scheduled_at),
          ends_at:          toLocalDatetime(a.ends_at),
          appointment_type: a.appointment_type || "",
          reason:           a.reason || "",
          notes:            a.notes || "",
        });
      })
      .catch(() => toast.error("Error al cargar la cita"))
      .finally(() => setLoading(false));
  }, []);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor_id || !form.scheduled_at || !form.ends_at) {
      toast.error("Doctor, hora de inicio y hora de fin son obligatorios");
      return;
    }
    if (new Date(form.ends_at) <= new Date(form.scheduled_at)) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/api/v1/appointments/${id}`, { appointment: form });
      toast.success("Cita actualizada correctamente");
      router.push(`/dashboard/appointments/${id}`);
    } catch (err) {
      const errs = err.response?.data?.errors || ["Error al guardar"];
      toast.error(errs[0]);
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: "100%", padding: "10px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "10px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const lbl = { display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appt) return null;

  const isRecurring = !!appt.recurrence_group_id;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/appointments/${id}`}>
          <button
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            ← Volver
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
            Editar cita #{appt.id}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {appt.patient?.name} · {appt.doctor?.full_name}
          </p>
        </div>
      </div>

      {/* Aviso si es serie */}
      {isRecurring && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm" style={{ color: "#7c3aed" }}>
            Esta cita pertenece a una serie (sesión {appt.recurrence_index} de {appt.recurrence_total}).
            Los cambios solo aplican a esta sesión individual.
          </p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl p-6 space-y-5"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Detalles de la cita
          </p>

          {/* Doctor */}
          <div>
            <label style={lbl}>Doctor *</label>
            <select
              value={form.doctor_id}
              onChange={(e) => set("doctor_id", e.target.value)}
              style={inp}
              required
            >
              <option value="">Seleccionar doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}{d.specialty ? ` — ${d.specialty}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo de cita *</label>
            <select
              value={form.appointment_type}
              onChange={(e) => set("appointment_type", e.target.value)}
              style={inp}
              required
            >
              <option value="">Seleccionar tipo...</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Fecha y horario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={lbl}>Hora de inicio *</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set("scheduled_at", e.target.value)}
                style={inp}
                required
              />
            </div>
            <div>
              <label style={lbl}>Hora de fin *</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => set("ends_at", e.target.value)}
                style={inp}
                required
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label style={lbl}>Motivo de la cita</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              placeholder="Describe el motivo de la consulta..."
              style={{ ...inp, resize: "vertical" }}
            />
          </div>

          {/* Notas */}
          <div>
            <label style={lbl}>Notas internas</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Notas adicionales para el equipo..."
              style={{ ...inp, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Info del paciente (readonly) */}
        <div className="rounded-xl p-5 flex items-center gap-4"
          style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#eff6ff" }}>
            <span className="text-sm font-bold" style={{ color: "#2563eb" }}>{appt.patient?.name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{appt.patient?.name}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {config.patientLabel} · {config.ownerLabel}: {appt.owner?.full_name}
            </p>
          </div>
          <span className="ml-auto text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: "#f1f5f9", color: "#94a3b8" }}>
            No editable
          </span>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
            style={{
              backgroundColor: saving ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link href={`/dashboard/appointments/${id}`}>
            <button
              type="button"
              className="text-sm font-medium px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
