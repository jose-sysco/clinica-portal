"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const SOAP_SECTIONS = [
  {
    key:         "subjective",
    field:       "soap_subjective",
    letter:      "S",
    title:       "Subjetivo",
    description: "Síntomas referidos por el paciente. Motivo de consulta en sus propias palabras.",
    placeholder: "El paciente refiere... Inicio hace X días, característica del síntoma...",
    color:       "#3b82f6",
    bg:          "#eff6ff",
    border:      "#bfdbfe",
  },
  {
    key:         "objective",
    field:       "soap_objective",
    letter:      "O",
    title:       "Objetivo",
    description: "Hallazgos del examen físico. Lo que el clínico observa y mide.",
    placeholder: "Al examen físico... Se observa... Auscultación...",
    color:       "#10b981",
    bg:          "#ecfdf5",
    border:      "#a7f3d0",
  },
  {
    key:         "assessment",
    field:       "soap_assessment",
    letter:      "A",
    title:       "Evaluación / Diagnóstico",
    description: "Diagnóstico o impresión diagnóstica basada en S y O.",
    placeholder: "Diagnóstico principal... Diagnósticos diferenciales...",
    color:       "#f59e0b",
    bg:          "#fffbeb",
    border:      "#fde68a",
    required:    true,
  },
  {
    key:         "plan",
    field:       "soap_plan",
    letter:      "P",
    title:       "Plan",
    description: "Plan terapéutico: medicamentos, indicaciones, estudios, seguimiento.",
    placeholder: "Medicamentos: ... Indicaciones: ... Próximo control: ...",
    color:       "#8b5cf6",
    bg:          "#f5f3ff",
    border:      "#ddd6fe",
  },
];

const EMPTY_FORM = {
  appointment_id:          "",
  // Vitales
  weight:                  "",
  height:                  "",
  temperature:             "",
  heart_rate:              "",
  respiratory_rate:        "",
  blood_pressure_systolic: "",
  blood_pressure_diastolic:"",
  oxygen_saturation:       "",
  // SOAP
  soap_subjective:         "",
  soap_objective:          "",
  soap_assessment:         "",
  soap_plan:               "",
  // Adicional
  medications:             "",
  notes:                   "",
  next_visit_date:         "",
};

export default function NewMedicalRecordPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [appointment,   setAppointment]   = useState(null);
  const [loading,       setLoading]       = useState(!!appointmentId);
  const [submitting,    setSubmitting]    = useState(false);
  const [errors,        setErrors]        = useState([]);
  const [form,          setForm]          = useState({ ...EMPTY_FORM, appointment_id: appointmentId || "" });
  const [scheduleNext,  setScheduleNext]  = useState(false);
  const [nextVisitTime, setNextVisitTime] = useState("");
  const [slots,         setSlots]         = useState([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);

  useEffect(() => {
    if (appointmentId) fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/api/v1/appointments/${appointmentId}`);
      setAppointment(res.data);
    } catch {
      toast.error("Error al cargar la cita");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    setSlots([]);
    setNextVisitTime("");
    try {
      const res = await api.get(`/api/v1/doctors/${doctorId}/availability`, {
        params: { date },
      });
      setSlots(res.data.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    if (!form.soap_assessment) {
      setErrors(["El campo A (Evaluación / Diagnóstico) es obligatorio"]);
      return;
    }
    if (scheduleNext && !nextVisitTime) {
      setErrors(["Selecciona un horario disponible para la próxima cita"]);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/v1/medical_records", { medical_record: form });

      // Si el usuario eligió agendar la próxima cita de inmediato
      if (scheduleNext && form.next_visit_date && appointment) {
        const scheduledAt = `${form.next_visit_date}T${nextVisitTime}:00`;
        const newAppt = await api.post("/api/v1/appointments", {
          appointment: {
            doctor_id:        appointment.doctor?.id,
            patient_id:       appointment.patient?.id,
            owner_id:         appointment.owner?.id,
            scheduled_at:     scheduledAt,
            appointment_type: "follow_up",
            reason:           "Control post-consulta",
          },
        });
        toast.success("Expediente guardado y cita de seguimiento agendada");
        router.push(`/dashboard/appointments/${newAppt.data.id}`);
      } else {
        toast.success("Expediente registrado correctamente");
        router.push("/dashboard/appointments");
      }
    } catch (err) {
      const errs = err.response?.data?.errors || ["Error al registrar el expediente"];
      setErrors(errs);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const lbl = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };

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
          <button className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            ← Volver
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
            Registrar consulta
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Expediente clínico — formato SOAP
          </p>
        </div>
      </div>

      {/* Info de la cita */}
      {appointment && (
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
            Información de la cita
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: config.patientLabel, value: appointment.patient?.name },
              { label: "Doctor",            value: appointment.doctor?.full_name },
              { label: config.ownerLabel,   value: appointment.owner?.full_name },
              { label: "Motivo",            value: appointment.reason },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{value}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Errores */}
      {errors.length > 0 && (
        <div className="px-4 py-3 rounded-lg text-sm space-y-1"
          style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Signos Vitales ── */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
            Signos vitales
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Fila 1 */}
            <div>
              <label style={lbl}>Peso (lb)</label>
              <input type="number" step="0.01" placeholder="65.5" style={inp}
                value={form.weight} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Talla (cm)</label>
              <input type="number" step="0.1" placeholder="170" style={inp}
                value={form.height} onChange={(e) => set("height", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Temperatura (°C)</label>
              <input type="number" step="0.1" placeholder="36.6" style={inp}
                value={form.temperature} onChange={(e) => set("temperature", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>SpO₂ (%)</label>
              <input type="number" step="0.1" min="0" max="100" placeholder="98" style={inp}
                value={form.oxygen_saturation} onChange={(e) => set("oxygen_saturation", e.target.value)} />
            </div>
            {/* Fila 2 */}
            <div>
              <label style={lbl}>Frec. cardíaca (ppm)</label>
              <input type="number" placeholder="72" style={inp}
                value={form.heart_rate} onChange={(e) => set("heart_rate", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Frec. respiratoria (rpm)</label>
              <input type="number" placeholder="16" style={inp}
                value={form.respiratory_rate} onChange={(e) => set("respiratory_rate", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Presión sistólica (mmHg)</label>
              <input type="number" placeholder="120" style={inp}
                value={form.blood_pressure_systolic} onChange={(e) => set("blood_pressure_systolic", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Presión diastólica (mmHg)</label>
              <input type="number" placeholder="80" style={inp}
                value={form.blood_pressure_diastolic} onChange={(e) => set("blood_pressure_diastolic", e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── SOAP ── */}
        {SOAP_SECTIONS.map((section) => (
          <div key={section.key} className="rounded-xl p-6"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg"
                style={{ backgroundColor: section.bg, color: section.color, border: `1px solid ${section.border}` }}
              >
                {section.letter}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                  {section.title}
                  {section.required && <span style={{ color: "#ef4444" }}> *</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{section.description}</p>
              </div>
            </div>
            <textarea
              rows={4}
              placeholder={section.placeholder}
              value={form[section.field]}
              onChange={(e) => set(section.field, e.target.value)}
              required={section.required}
              style={{ ...inp, resize: "vertical", lineHeight: "1.6" }}
            />
          </div>
        ))}

        {/* ── Medicamentos y notas ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
              Medicamentos recetados
            </p>
            <textarea
              rows={4}
              placeholder={"Medicamento — dosis — frecuencia — duración\nEj: Ibuprofeno 400mg cada 8h por 5 días"}
              value={form.medications}
              onChange={(e) => set("medications", e.target.value)}
              style={{ ...inp, resize: "none", lineHeight: "1.6" }}
            />
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
              Notas adicionales
            </p>
            <textarea
              rows={3}
              placeholder="Observaciones, indicaciones especiales..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              style={{ ...inp, resize: "none", lineHeight: "1.6" }}
            />
            <div className="mt-4 space-y-3">
              <div>
                <label style={lbl}>Próxima visita recomendada</label>
                <input
                  type="date"
                  style={inp}
                  value={form.next_visit_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    const date = e.target.value;
                    set("next_visit_date", date);
                    if (!date) {
                      setScheduleNext(false);
                      setSlots([]);
                      setNextVisitTime("");
                    } else if (scheduleNext && appointment?.doctor?.id) {
                      fetchSlots(appointment.doctor.id, date);
                    }
                  }}
                />
              </div>

              {/* Prompt para agendar de inmediato — solo si hay fecha Y hay contexto de cita */}
              {form.next_visit_date && appointment && (
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#15803d" }}>
                        ¿Agendar esta cita ahora?
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#16a34a" }}>
                        Se creará una cita de seguimiento para {appointment.patient?.name} con {appointment.doctor?.full_name}
                      </p>
                    </div>
                    {/* Toggle Sí/No */}
                    <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid #bbf7d0" }}>
                      {[{ val: true, label: "Sí" }, { val: false, label: "No" }].map(({ val, label }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setScheduleNext(val);
                            if (val && form.next_visit_date && appointment?.doctor?.id) {
                              fetchSlots(appointment.doctor.id, form.next_visit_date);
                            }
                            if (!val) {
                              setSlots([]);
                              setNextVisitTime("");
                            }
                          }}
                          className="px-4 py-1.5 text-xs font-semibold transition-colors"
                          style={{
                            backgroundColor: scheduleNext === val ? "#16a34a" : "#ffffff",
                            color:           scheduleNext === val ? "#ffffff" : "#64748b",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {scheduleNext && (
                    <div className="pt-1 space-y-2">
                      <label style={{ ...lbl, color: "#15803d" }}>Horario disponible</label>
                      {slotsLoading ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs" style={{ color: "#16a34a" }}>Cargando horarios...</span>
                        </div>
                      ) : slots.length === 0 ? (
                        <p className="text-xs" style={{ color: "#94a3b8" }}>
                          No hay horarios disponibles para esta fecha.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {slots.map((slot, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setNextVisitTime(slot.starts_at)}
                              className="py-1.5 rounded-lg text-xs font-medium transition-all"
                              style={{
                                backgroundColor: nextVisitTime === slot.starts_at ? "#16a34a" : "#ffffff",
                                color:           nextVisitTime === slot.starts_at ? "#ffffff" : "#16a34a",
                                border:          `1px solid ${nextVisitTime === slot.starts_at ? "#16a34a" : "#bbf7d0"}`,
                              }}
                            >
                              {slot.starts_at}
                            </button>
                          ))}
                        </div>
                      )}
                      {nextVisitTime && (
                        <div className="rounded-lg px-3 py-2 text-xs inline-block"
                          style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
                          {new Date(`${form.next_visit_date}T${nextVisitTime}`).toLocaleDateString("es-GT", {
                            weekday: "short", day: "numeric", month: "short",
                          })}{" "}· {nextVisitTime}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: submitting ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting
            ? "Guardando..."
            : scheduleNext
              ? "Guardar expediente y agendar cita →"
              : "Guardar expediente"}
          </button>
          <Link href="/dashboard/appointments">
            <button type="button" className="px-6 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
