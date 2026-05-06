"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

const DAYS_ES  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── Mini-calendario ─────────────────────────────────────────────────────────
function Calendar({ value, onChange }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const firstDay  = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const fmt = (d) => {
    const dd = String(d).padStart(2, "0");
    const mm = String(view.m + 1).padStart(2, "0");
    return `${view.y}-${mm}-${dd}`;
  };

  const isPast = (d) => {
    const date = new Date(view.y, view.m, d);
    date.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return date < t;
  };

  const prevMonth = () => {
    setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  };
  const nextMonth = () => {
    setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });
  };

  const canGoPrev = view.y > today.getFullYear() || view.m > today.getMonth();

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
      {/* Nav */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30"
          style={{ color: "#64748b" }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
          {MONTHS_ES[view.m]} {view.y}
        </span>
        <button type="button" onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ color: "#64748b" }}>›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_ES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-1"
            style={{ color: "#475569" }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const past     = isPast(d);
          const selected = value === fmt(d);
          return (
            <button key={d} type="button"
              disabled={past}
              onClick={() => !past && onChange(fmt(d))}
              className="w-9 h-9 mx-auto flex items-center justify-center rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              style={selected
                ? { backgroundColor: "#2563eb", color: "#fff" }
                : past
                  ? { color: "#334155" }
                  : { color: "#94a3b8" }}
              onMouseEnter={(e) => { if (!past && !selected) e.currentTarget.style.backgroundColor = "#0f172a"; }}
              onMouseLeave={(e) => { if (!past && !selected) e.currentTarget.style.backgroundColor = "transparent"; }}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Indicador de pasos ───────────────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={s < current
              ? { backgroundColor: "#14532d", color: "#4ade80" }
              : s === current
                ? { backgroundColor: "#2563eb", color: "#fff" }
                : { backgroundColor: "#1e293b", color: "#475569", border: "1px solid #334155" }}>
            {s < current ? "✓" : s}
          </div>
          {s < total && <div className="w-6 h-px" style={{ backgroundColor: s < current ? "#14532d" : "#334155" }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function BookingPage({ params }) {
  const { slug } = params;

  const [clinic,   setClinic]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step,     setStep]     = useState(1); // 1 doctor, 2 fecha, 3 hora, 4 datos, 5 éxito
  const [doctor,   setDoctor]   = useState(null);
  const [date,     setDate]     = useState("");
  const [slots,    setSlots]    = useState([]);
  const [loadSlots,setLS]       = useState(false);
  const [slot,     setSlot]     = useState(null);
  const [form,     setForm]     = useState({ first_name: "", last_name: "", phone: "", email: "", reason: "" });
  const [submitting, setSub]    = useState(false);
  const [bookResult, setResult] = useState(null);
  const [error,    setError]    = useState("");

  // Cargar clínica
  useEffect(() => {
    fetch(`${API}/api/public/clinics/${slug}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setClinic(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  // Saltar paso 1 si solo hay 1 doctor
  useEffect(() => {
    if (clinic?.doctors?.length === 1) {
      setDoctor(clinic.doctors[0]);
      setStep(2);
    }
  }, [clinic]);

  // Cargar slots cuando cambia fecha o doctor
  const fetchSlots = useCallback(async (d) => {
    if (!doctor || !d) return;
    setLS(true);
    setSlot(null);
    setSlots([]);
    try {
      const r = await fetch(`${API}/api/public/clinics/${slug}/slots?doctor_id=${doctor.id}&date=${d}`);
      const data = await r.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLS(false);
    }
  }, [doctor, slug]);

  const handleDateChange = (d) => {
    setDate(d);
    fetchSlots(d);
  };

  const handleSubmit = async () => {
    setError("");
    setSub(true);
    try {
      const r = await fetch(`${API}/api/public/clinics/${slug}/book`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          doctor_id:  doctor.id,
          date,
          time:       slot.starts_at,
          ...form,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error al registrar la solicitud");
        return;
      }
      setResult(data);
      setStep(5);
    } catch {
      setError("Error de conexión, intenta de nuevo");
    } finally {
      setSub(false);
    }
  };

  const inputStyle = { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" };

  // ── Estados de carga ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}
        className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !clinic) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}
        className="flex flex-col items-center justify-center gap-4">
        <p className="text-lg" style={{ color: "#475569" }}>Clínica no encontrada</p>
        <Link href="/reservas" className="text-sm" style={{ color: "#3b82f6" }}>
          ← Volver al directorio
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      {/* Header de la clínica */}
      <div style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Link href="/reservas" className="text-xs flex items-center gap-1 mb-4"
            style={{ color: "#475569", textDecoration: "none" }}>
            ← Directorio
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{ backgroundColor: "#2563eb22", color: "#3b82f6", border: "1px solid #2563eb44" }}>
              {clinic.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{clinic.name}</h1>
              <p className="text-sm" style={{ color: "#64748b" }}>
                {clinic.type_label}{clinic.city ? ` · ${clinic.city}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Paso 5: Éxito */}
        {step === 5 && bookResult && (
          <div className="rounded-2xl p-8 text-center space-y-4"
            style={{ backgroundColor: "#1e293b", border: "1px solid #14532d" }}>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl"
              style={{ backgroundColor: "#14532d33", border: "1px solid #14532d" }}>
              ✓
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "#4ade80" }}>
                ¡Solicitud enviada!
              </p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                La clínica revisará tu solicitud y la confirmará pronto.
              </p>
            </div>
            <div className="rounded-xl p-4 text-left space-y-2"
              style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
              <p className="text-xs" style={{ color: "#475569" }}>
                <span style={{ color: "#64748b" }}>Clínica: </span>
                <span style={{ color: "#94a3b8" }}>{bookResult.appointment.clinic}</span>
              </p>
              <p className="text-xs" style={{ color: "#475569" }}>
                <span style={{ color: "#64748b" }}>Doctor: </span>
                <span style={{ color: "#94a3b8" }}>{bookResult.appointment.doctor}</span>
              </p>
              <p className="text-xs" style={{ color: "#475569" }}>
                <span style={{ color: "#64748b" }}>Fecha: </span>
                <span style={{ color: "#94a3b8" }}>{bookResult.appointment.scheduled_at}</span>
              </p>
            </div>
            {form.email && (
              <p className="text-xs" style={{ color: "#475569" }}>
                Recibirás una confirmación en <span style={{ color: "#94a3b8" }}>{form.email}</span>
              </p>
            )}
            <Link href="/reservas" className="inline-block text-sm mt-2"
              style={{ color: "#3b82f6", textDecoration: "none" }}>
              ← Volver al directorio
            </Link>
          </div>
        )}

        {step < 5 && (
          <>
            {/* Indicador de pasos */}
            <div className="flex items-center justify-between">
              <Steps current={step} total={4} />
              <p className="text-xs" style={{ color: "#475569" }}>
                Paso {step} de 4
              </p>
            </div>

            {/* Paso 1: Elegir doctor */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>
                  Selecciona el profesional
                </p>
                {clinic.doctors.map((d) => (
                  <button key={d.id} onClick={() => { setDoctor(d); setStep(2); }}
                    className="w-full rounded-xl p-4 text-left flex items-start gap-4 transition-all"
                    style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563eb88")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#334155")}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: "#2563eb22", color: "#3b82f6", border: "1px solid #2563eb44" }}>
                      {d.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{d.full_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{d.specialty}</p>
                      {d.bio && <p className="text-xs mt-1 line-clamp-2" style={{ color: "#334155" }}>{d.bio}</p>}
                      <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                        Consulta: {d.consultation_duration} min
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Paso 2: Elegir fecha */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>
                    Selecciona una fecha
                  </p>
                  <button onClick={() => { setStep(1); setDoctor(null); setDate(""); setSlots([]); }}
                    className="text-xs" style={{ color: "#475569" }}>
                    ← Cambiar doctor
                  </button>
                </div>
                <p className="text-xs" style={{ color: "#475569" }}>
                  Doctor: <span style={{ color: "#94a3b8" }}>{doctor?.full_name}</span>
                </p>
                <Calendar value={date} onChange={(d) => { handleDateChange(d); setStep(3); }} />
              </div>
            )}

            {/* Paso 3: Elegir hora */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>
                    Selecciona un horario
                  </p>
                  <button onClick={() => { setStep(2); setSlot(null); }}
                    className="text-xs" style={{ color: "#475569" }}>
                    ← Cambiar fecha
                  </button>
                </div>
                <p className="text-xs" style={{ color: "#475569" }}>
                  {new Date(date + "T12:00:00").toLocaleDateString("es-GT", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>

                {loadSlots ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-xl py-10 text-center"
                    style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                    <p className="text-sm" style={{ color: "#475569" }}>Sin horarios disponibles para este día</p>
                    <button onClick={() => setStep(2)}
                      className="text-xs mt-3 block mx-auto" style={{ color: "#3b82f6" }}>
                      Elegir otra fecha
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const isSelected = slot?.starts_at === s.starts_at;
                      return (
                        <button key={s.starts_at} onClick={() => { setSlot(s); setStep(4); }}
                          className="text-sm font-semibold py-3 rounded-xl"
                          style={isSelected
                            ? { backgroundColor: "#2563eb", color: "#fff" }
                            : { backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#2563eb88"; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#334155"; }}>
                          {s.starts_at}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Paso 4: Datos del paciente */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#94a3b8" }}>
                    Tus datos de contacto
                  </p>
                  <button onClick={() => { setStep(3); setSlot(null); }}
                    className="text-xs" style={{ color: "#475569" }}>
                    ← Cambiar horario
                  </button>
                </div>

                {/* Resumen de la reserva */}
                <div className="rounded-xl p-4 space-y-1.5"
                  style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                  <p className="text-xs" style={{ color: "#475569" }}>
                    <span style={{ color: "#64748b" }}>Doctor: </span>
                    <span style={{ color: "#94a3b8" }}>{doctor?.full_name}</span>
                  </p>
                  <p className="text-xs" style={{ color: "#475569" }}>
                    <span style={{ color: "#64748b" }}>Fecha: </span>
                    <span style={{ color: "#94a3b8" }}>
                      {new Date(date + "T12:00:00").toLocaleDateString("es-GT", {
                        day: "numeric", month: "long", year: "numeric",
                      })} · {slot?.starts_at}
                    </span>
                  </p>
                </div>

                {/* Formulario */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        Nombre <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input type="text" value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        placeholder="Nombre"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        Apellido <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input type="text" value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        placeholder="Apellido"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inputStyle} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        Teléfono <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input type="tel" value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+502 0000-0000"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        Correo electrónico
                      </label>
                      <input type="email" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                      Motivo de consulta <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Describe brevemente el motivo de tu consulta..."
                      rows={3}
                      className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                      style={inputStyle} />
                  </div>
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "#450a0a33", color: "#ef4444", border: "1px solid #450a0a55" }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.first_name || !form.last_name || !form.phone || !form.reason}
                  className="w-full text-sm font-bold py-3.5 rounded-xl disabled:opacity-50"
                  style={{ backgroundColor: "#2563eb", color: "#fff" }}>
                  {submitting ? "Enviando solicitud..." : "Solicitar cita"}
                </button>
                <p className="text-xs text-center" style={{ color: "#334155" }}>
                  La cita quedará pendiente hasta que la clínica la confirme
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
