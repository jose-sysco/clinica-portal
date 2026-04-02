"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = [
  { key: "monday", label: "Lunes", num: 1, weekend: false },
  { key: "tuesday", label: "Martes", num: 2, weekend: false },
  { key: "wednesday", label: "Miércoles", num: 3, weekend: false },
  { key: "thursday", label: "Jueves", num: 4, weekend: false },
  { key: "friday", label: "Viernes", num: 5, weekend: false },
  { key: "saturday", label: "Sábado", num: 6, weekend: true },
  { key: "sunday", label: "Domingo", num: 0, weekend: true },
];

function countSlots(start, end, duration) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? Math.floor(mins / duration) : 0;
}

function markOnboardingDone(orgId) {
  try {
    localStorage.setItem(`onboarding_done_${orgId}`, "1");
  } catch {}
}

// ── Step components ───────────────────────────────────────────────────────────

function StepWelcome({ organization, config, onNext, onSkip }) {
  return (
    <div className="text-center space-y-8">
      {/* Org badge */}
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
          style={{ backgroundColor: "#2563eb" }}
        >
          {organization?.name?.[0] || "C"}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: "#0f172a" }}>
          ¡Bienvenido a {organization?.name}!
        </h1>
        <p className="text-base" style={{ color: "#64748b" }}>
          Tu sistema de gestión de {config.patientsLabel.toLowerCase()} está
          listo.
          <br />
          Configúralo en 2 pasos simples para empezar a agendar citas.
        </p>
      </div>

      {/* Steps preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {[
          {
            icon: "✚",
            color: "#2563eb",
            bg: "#eff6ff",
            border: "#bfdbfe",
            title: "Agregar un profesional",
            desc: `Registra el primer ${config.staffSingularLabel} o profesional de tu equipo`,
          },
          {
            icon: "◷",
            color: "#16a34a",
            bg: "#f0fdf4",
            border: "#bbf7d0",
            title: "Configurar su horario",
            desc: "Define los días y horas en que atiende para generar disponibilidad",
          },
        ].map((s) => (
          <div
            key={s.title}
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: s.bg, border: `1px solid ${s.border}` }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base font-bold"
              style={{ backgroundColor: "#ffffff", color: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "#0f172a" }}
              >
                {s.title}
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <button
          onClick={onNext}
          className="px-8 py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#1d4ed8")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#2563eb")
          }
        >
          Comenzar configuración →
        </button>
        <button
          onClick={onSkip}
          className="px-8 py-3 rounded-xl text-sm font-medium"
          style={{ color: "#94a3b8", backgroundColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#64748b")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          Configurar después
        </button>
      </div>
    </div>
  );
}

function StepDoctor({ config, onNext, onBack }) {
  const inp = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };
  const lbl = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  };

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    specialty: "",
    license_number: "",
    consultation_duration: 30,
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      // Single transactional request — backend creates user + doctor atomically
      const doctorRes = await api.post("/api/v1/doctors", {
        user: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          password_confirmation: form.password,
        },
        doctor: {
          specialty: form.specialty,
          license_number: form.license_number,
          consultation_duration: parseInt(form.consultation_duration),
        },
      });
      onNext({
        doctor: doctorRes.data,
        doctorName: `${form.first_name} ${form.last_name}`,
        duration: parseInt(form.consultation_duration),
      });
    } catch (err) {
      setErrors(
        err.response?.data?.errors || [
          err.response?.data?.error || "Error al crear el profesional",
        ],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "#0f172a" }}>
          Agregar primer profesional
        </h2>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Crea la cuenta del primer {config.doctorLabel || "doctor"} de tu
          equipo
        </p>
      </div>

      {errors.length > 0 && (
        <div
          className="px-4 py-3 rounded-lg text-sm space-y-1"
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          }}
        >
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={lbl}>Nombre *</label>
          <input
            type="text"
            required
            placeholder="Roberto"
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Apellido *</label>
          <input
            type="text"
            required
            placeholder="Méndez"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            style={inp}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label style={lbl}>Email *</label>
          <input
            type="email"
            required
            placeholder="correo@correo.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Teléfono</label>
          <input
            type="text"
            placeholder="55551234"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            style={inp}
          />
        </div>
      </div>

      <div>
        <label style={lbl}>Contraseña temporal *</label>
        <input
          type="password"
          required
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
          style={inp}
        />
        <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
          El profesional podrá cambiarla desde su perfil
        </p>
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#94a3b8" }}
        >
          Datos profesionales
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={lbl}>Especialidad *</label>
            <input
              type="text"
              required
              placeholder="Medicina General"
              value={form.specialty}
              onChange={(e) => set("specialty", e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Duración de cita *</label>
            <select
              value={form.consultation_duration}
              onChange={(e) => set("consultation_duration", e.target.value)}
              style={inp}
            >
              {[15, 20, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label style={lbl}>Cédula / licencia</label>
          <input
            type="text"
            placeholder="Opcional"
            value={form.license_number}
            onChange={(e) => set("license_number", e.target.value)}
            style={inp}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            border: "1px solid #e2e8f0",
          }}
        >
          ← Atrás
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: loading ? "#93c5fd" : "#2563eb",
            color: "#ffffff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creando cuenta..." : "Continuar →"}
        </button>
      </div>
    </form>
  );
}

function StepSchedule({ doctorData, onNext, onBack }) {
  const [rows, setRows] = useState(
    DAYS.map((d) => ({
      ...d,
      active: !d.weekend,
      start: "08:00",
      end: d.weekend ? "13:00" : "17:00",
    })),
  );
  const [saving, setSaving] = useState(false);

  const toggle = (i) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, active: !r.active } : r)),
    );
  const update = (i, field, val) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)),
    );

  const totalSlots = rows
    .filter((r) => r.active)
    .reduce(
      (acc, r) => acc + countSlots(r.start, r.end, doctorData.duration),
      0,
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const active = rows.filter((r) => r.active);
      if (active.length > 0) {
        await Promise.all(
          active.map((r) =>
            api.post(`/api/v1/doctors/${doctorData.doctor.id}/schedules`, {
              schedule: {
                day_of_week: r.num,
                start_time: r.start,
                end_time: r.end,
                is_active: true,
              },
            }),
          ),
        );
      }
      onNext({ scheduleRows: rows, totalSlots });
    } catch (err) {
      const msg =
        err.response?.data?.errors?.join(", ") || "Error al guardar horario";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "#0f172a" }}>
          Configurar horario de atención
        </h2>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Define cuándo atiende <strong>{doctorData.doctorName}</strong> para
          generar sus slots de disponibilidad
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #e2e8f0" }}
      >
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="px-4 py-3 flex items-center gap-4"
            style={{
              borderBottom: i < rows.length - 1 ? "1px solid #f8fafc" : "none",
              backgroundColor: row.active ? "#ffffff" : "#fafafa",
            }}
          >
            {/* Toggle */}
            <button
              type="button"
              onClick={() => toggle(i)}
              style={{
                width: "40px",
                height: "22px",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                className="absolute inset-0 rounded-full transition-colors"
                style={{ backgroundColor: row.active ? "#2563eb" : "#e2e8f0" }}
              />
              <div
                className="absolute top-0.5 w-[18px] h-[18px] rounded-full transition-all"
                style={{
                  left: row.active ? "20px" : "2px",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>

            <div style={{ width: "88px", flexShrink: 0 }}>
              <p
                className="text-sm font-medium"
                style={{ color: row.active ? "#0f172a" : "#94a3b8" }}
              >
                {row.label}
              </p>
            </div>

            {row.active ? (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input
                  type="time"
                  value={row.start}
                  onChange={(e) => update(i, "start", e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg outline-none"
                  style={{ border: "1px solid #e2e8f0", color: "#0f172a" }}
                />
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  hasta
                </span>
                <input
                  type="time"
                  value={row.end}
                  onChange={(e) => update(i, "end", e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-lg outline-none"
                  style={{ border: "1px solid #e2e8f0", color: "#0f172a" }}
                />
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
                >
                  {countSlots(row.start, row.end, doctorData.duration)} slots
                </span>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#cbd5e1" }}>
                No disponible
              </p>
            )}
          </div>
        ))}

        {/* Footer summary */}
        <div
          className="px-4 py-3 flex items-center gap-4 flex-wrap"
          style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}
        >
          <span className="text-xs" style={{ color: "#64748b" }}>
            <strong style={{ color: "#0f172a" }}>
              {rows.filter((r) => r.active).length}
            </strong>{" "}
            días activos
          </span>
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              backgroundColor: "#f0fdf4",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
            }}
          >
            {totalSlots} citas posibles por semana
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            border: "1px solid #e2e8f0",
          }}
        >
          ← Atrás
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            backgroundColor: saving ? "#93c5fd" : "#2563eb",
            color: "#ffffff",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Guardando..." : "Guardar horario →"}
        </button>
        <button
          onClick={() => onNext({ scheduleRows: [], totalSlots: 0 })}
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ color: "#94a3b8" }}
        >
          Omitir
        </button>
      </div>
    </div>
  );
}

function StepDone({ doctorData, scheduleData, organization, onFinish }) {
  const router = useRouter();

  const actions = [
    {
      icon: "◷",
      label: "Crear primera cita",
      href: "/dashboard/appointments/new",
      color: "#2563eb",
      bg: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      icon: "✚",
      label: "Agregar otro profesional",
      href: "/dashboard/doctors/new",
      color: "#7c3aed",
      bg: "#faf5ff",
      border: "#ddd6fe",
    },
    {
      icon: "⊞",
      label: "Ir al dashboard",
      href: "/dashboard",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
    },
  ];

  return (
    <div className="text-center space-y-8">
      {/* Success icon */}
      <div className="flex justify-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ backgroundColor: "#f0fdf4", border: "4px solid #bbf7d0" }}
        >
          ✓
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-3" style={{ color: "#0f172a" }}>
          ¡Todo listo!
        </h2>
        <p className="text-base" style={{ color: "#64748b" }}>
          {organization?.name} está configurada y lista para atender pacientes.
        </p>
      </div>

      {/* Summary */}
      <div
        className="rounded-xl p-5 text-left space-y-3"
        style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#94a3b8" }}
        >
          Resumen
        </p>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
          >
            ✚
          </div>
          <p className="text-sm" style={{ color: "#0f172a" }}>
            <strong>{doctorData.doctorName}</strong> —{" "}
            {doctorData.doctor.specialty}
          </p>
        </div>
        {scheduleData.totalSlots > 0 && (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}
            >
              ◷
            </div>
            <p className="text-sm" style={{ color: "#0f172a" }}>
              <strong>
                {scheduleData.scheduleRows.filter((r) => r.active).length} días
              </strong>{" "}
              de horario — {scheduleData.totalSlots} slots por semana
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              onFinish();
              router.push(a.href);
            }}
            className="p-4 rounded-xl text-left transition-all"
            style={{ backgroundColor: a.bg, border: `1px solid ${a.border}` }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <div className="text-xl mb-2">{a.icon}</div>
            <p className="text-sm font-semibold" style={{ color: a.color }}>
              {a.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { organization, user } = useAuth();
  const router = useRouter();
  const config = getConfig(organization?.clinic_type);
  const STEPS = ["Bienvenida", config.staffSingularLabel, "Horario", "¡Listo!"];
  const [step, setStep] = useState(0);
  const [doctorData, setDoctorData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);

  const finishOnboarding = () => markOnboardingDone(organization?.id);

  const handleSkip = () => {
    finishOnboarding();
    router.push("/dashboard");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f1f5f9" }}
    >
      {/* Top bar */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: "#2563eb" }}
          >
            {organization?.name?.[0] || "C"}
          </div>
          <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
            {organization?.name}
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="text-xs"
          style={{ color: "#94a3b8" }}
        >
          Omitir configuración
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 pt-8 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    backgroundColor:
                      i < step ? "#16a34a" : i === step ? "#2563eb" : "#e2e8f0",
                    color: i <= step ? "#ffffff" : "#94a3b8",
                  }}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: i === step ? "#0f172a" : "#94a3b8" }}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1"
                  style={{ backgroundColor: i < step ? "#16a34a" : "#e2e8f0" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div
          className="rounded-2xl p-6 sm:p-8 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          {step === 0 && (
            <StepWelcome
              organization={organization}
              config={config}
              onNext={() => setStep(1)}
              onSkip={handleSkip}
            />
          )}
          {step === 1 && (
            <StepDoctor
              config={config}
              onNext={(data) => {
                setDoctorData(data);
                setStep(2);
              }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && doctorData && (
            <StepSchedule
              doctorData={doctorData}
              onNext={(data) => {
                setScheduleData(data);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && doctorData && scheduleData && (
            <StepDone
              doctorData={doctorData}
              scheduleData={scheduleData}
              organization={organization}
              onFinish={finishOnboarding}
            />
          )}
        </div>
      </div>
    </div>
  );
}
