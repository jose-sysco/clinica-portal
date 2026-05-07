"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                   "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── Calendario ───────────────────────────────────────────────────────────────
function Calendar({ value, onChange }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  const firstDay   = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const fmt = (d) =>
    `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isPast = (d) => {
    const date = new Date(view.y, view.m, d);
    date.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return date < t;
  };

  const canPrev = view.y > today.getFullYear() || view.m > today.getMonth();

  const prevMonth = () => setView((v) => v.m === 0  ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const nextMonth = () => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0  } : { y: v.y, m: v.m + 1 });

  return (
    <div className="rounded-2xl p-4"
      style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} disabled={!canPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-30 text-lg"
          style={{ color: "#94a3b8" }}>‹</button>
        <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>
          {MONTHS_ES[view.m]} {view.y}
        </span>
        <button type="button" onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-lg"
          style={{ color: "#94a3b8" }}>›</button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAYS_ES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: "#cbd5e1" }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const past     = isPast(d);
          const selected = value === fmt(d);
          return (
            <button key={d} type="button" disabled={past}
              onClick={() => !past && onChange(fmt(d))}
              className="w-9 h-9 mx-auto flex items-center justify-center rounded-xl text-sm font-medium disabled:cursor-not-allowed"
              style={selected
                ? { backgroundColor: "#2563eb", color: "#fff" }
                : past
                  ? { color: "#e2e8f0" }
                  : { color: "#475569" }}
              onMouseEnter={(e) => { if (!past && !selected) e.currentTarget.style.backgroundColor = "#eff6ff"; }}
              onMouseLeave={(e) => { if (!past && !selected) e.currentTarget.style.backgroundColor = "transparent"; }}>
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={s < current
              ? { backgroundColor: "#dcfce7", color: "#16a34a" }
              : s === current
                ? { backgroundColor: "#2563eb", color: "#fff" }
                : { backgroundColor: "#f1f5f9", color: "#cbd5e1", border: "1px solid #e2e8f0" }}>
            {s < current ? "✓" : s}
          </div>
          {s < total && (
            <div className="w-6 h-px" style={{ backgroundColor: s < current ? "#86efac" : "#e2e8f0" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function BookingPage({ params }) {
  const { slug } = use(params);

  const [clinic,   setClinic]  = useState(null);
  const [loading,  setLoading] = useState(true);
  const [notFound, setNF]      = useState(false);

  const [step,   setStep]  = useState(1);
  const [location, setLocation] = useState(null);
  const [doctor, setDoc]   = useState(null);
  const [date,   setDate]  = useState("");
  const [slots,  setSlots] = useState([]);
  const [loadSlots, setLS] = useState(false);
  const [slot,   setSlot]  = useState(null);
  const [form,   setForm]  = useState({ first_name: "", last_name: "", phone: "", email: "", reason: "", patient_name: "", is_minor: null });
  const [submitting, setSub] = useState(false);
  const [result,       setResult]       = useState(null);
  const [admissionToken, setAdmissionToken] = useState(null);
  const [error,   setError]  = useState("");

  useEffect(() => {
    fetch(`${API}/api/public/clinics/${slug}`)
      .then((r) => { if (!r.ok) { setNF(true); return null; } return r.json(); })
      .then((d) => { if (d) setClinic(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  const hasLocations = (clinic?.locations?.length ?? 0) > 0;

  useEffect(() => {
    if (!clinic) return;
    const locs = clinic.locations ?? [];
    // Si solo hay 1 sede, seleccionarla automáticamente
    if (locs.length === 1) setLocation(locs[0]);
    // Si no hay sedes y solo hay 1 doctor, saltar al paso 2
    if (locs.length === 0 && clinic.doctors?.length === 1) {
      setDoc(clinic.doctors[0]); setStep(2);
    }
  }, [clinic]);

  const fetchSlots = useCallback(async (d) => {
    if (!doctor || !d) return;
    setLS(true); setSlot(null); setSlots([]);
    try {
      const locParam = location?.id ? `&location_id=${location.id}` : "";
      const r = await fetch(`${API}/api/public/clinics/${slug}/slots?doctor_id=${doctor.id}&date=${d}${locParam}`);
      const data = await r.json();
      setSlots(data.slots || []);
    } catch { setSlots([]); } finally { setLS(false); }
  }, [doctor, slug, location]);

  const handleDateChange = (d) => { setDate(d); fetchSlots(d); };

  const isVet       = clinic?.clinic_type === "veterinary";
  const isPediatric = clinic?.clinic_type === "pediatric";
  const needsPatientName = isVet || (isPediatric && form.is_minor === true);

  const handleSubmit = async () => {
    setError(""); setSub(true);
    try {
      const payload = {
        doctor_id: doctor.id, date, time: slot.starts_at,
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone, email: form.email, reason: form.reason,
      };
      if (needsPatientName && form.patient_name) payload.patient_name = form.patient_name;
      if (location?.id) payload.location_id = location.id;
      const r = await fetch(`${API}/api/public/clinics/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Error al enviar la solicitud"); return; }
      setResult(data); setAdmissionToken(data.admission_token || null); setStep(5);
    } catch { setError("Error de conexión, intenta de nuevo"); } finally { setSub(false); }
  };

  const inp = {
    backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}
      className="flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !clinic) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}
      className="flex flex-col items-center justify-center gap-4">
      <p className="text-lg" style={{ color: "#94a3b8" }}>Clínica no encontrada</p>
      <Link href="/reservas" style={{ color: "#2563eb", textDecoration: "none", fontSize: "14px" }}>
        ← Volver al directorio
      </Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div className="max-w-2xl mx-auto px-6 py-5">
          <Link href="/reservas"
            style={{ color: "#94a3b8", textDecoration: "none", fontSize: "13px", display: "flex",
              alignItems: "center", gap: "4px", marginBottom: "16px" }}>
            ← Directorio
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
              style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
              {clinic.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#0f172a" }}>{clinic.name}</h1>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                {clinic.type_label}{clinic.city ? ` · ${clinic.city}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Paso 5: Éxito */}
        {step === 5 && result && (
          <div className="rounded-2xl p-8 text-center space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #bbf7d0",
              boxShadow: "0 4px 12px rgba(16,185,129,0.08)" }}>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl"
              style={{ backgroundColor: "#dcfce7", border: "1px solid #86efac" }}>
              ✓
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "#16a34a" }}>¡Solicitud enviada!</p>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                La clínica revisará tu solicitud y la confirmará pronto.
              </p>
            </div>
            <div className="rounded-xl p-4 text-left space-y-2"
              style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p className="text-xs" style={{ color: "#64748b" }}>
                <span className="font-medium">Clínica: </span>{result.appointment.clinic}
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                <span className="font-medium">Doctor: </span>{result.appointment.doctor}
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                <span className="font-medium">Fecha: </span>{result.appointment.scheduled_at}
              </p>
            </div>
            {form.email && (
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Recibirás confirmación en <span style={{ color: "#475569" }}>{form.email}</span>
              </p>
            )}

            {admissionToken && (
              <div className="rounded-xl p-4 text-left"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <p className="text-sm font-semibold" style={{ color: "#15803d", marginBottom: "6px" }}>
                  Completa tu formulario de admisión
                </p>
                <p className="text-xs" style={{ color: "#166534", marginBottom: "12px", lineHeight: "1.5" }}>
                  Tarda solo 2 minutos y ayuda al profesional a atenderte mejor.
                </p>
                <Link href={`/reservas/admision/${admissionToken}`}
                  style={{ display: "inline-block", backgroundColor: "#16a34a", color: "#ffffff",
                    fontSize: "13px", fontWeight: "700", padding: "9px 18px", borderRadius: "8px",
                    textDecoration: "none" }}>
                  Llenar ahora →
                </Link>
              </div>
            )}

            <Link href="/reservas"
              style={{ display: "inline-block", marginTop: "8px", color: "#2563eb",
                textDecoration: "none", fontSize: "14px" }}>
              ← Volver al directorio
            </Link>
          </div>
        )}

        {/* Selección de sede — pantalla previa a los pasos */}
        {step < 5 && hasLocations && !location && (
          <div className="space-y-3">
            <p className="text-sm font-semibold" style={{ color: "#475569" }}>
              Selecciona una sede
            </p>
            {clinic.locations.map((loc) => (
              <button key={loc.id} onClick={() => {
                  setLocation(loc);
                  // Si solo hay 1 doctor en esa sede, auto-seleccionar
                  const locDoctors = clinic.doctors.filter((d) => !d.location_ids?.length || d.location_ids.includes(loc.id));
                  if (locDoctors.length === 1) { setDoc(locDoctors[0]); setStep(2); }
                }}
                className="w-full rounded-2xl p-4 text-left flex items-start gap-4 transition-all"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  📍
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{loc.name}</p>
                  {(loc.address || loc.city) && (
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                      {[loc.address, loc.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>
                    {clinic.doctors.filter((d) => !d.location_ids?.length || d.location_ids.includes(loc.id)).length} profesional(es)
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step < 5 && (!hasLocations || location) && (
          <>
            <div className="flex items-center justify-between">
              <Steps current={step} total={4} />
              <p className="text-xs" style={{ color: "#94a3b8" }}>Paso {step} de 4</p>
            </div>

            {/* Paso 1: Doctor */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#475569" }}>
                    Selecciona el profesional
                  </p>
                  {hasLocations && (
                    <button onClick={() => { setLocation(null); setDoc(null); setDate(""); setSlots([]); setSlot(null); }}
                      className="text-xs" style={{ color: "#94a3b8" }}>
                      ← Cambiar sede
                    </button>
                  )}
                </div>
                {location && (
                  <p className="text-xs" style={{ color: "#64748b" }}>
                    Sede: <span style={{ color: "#475569", fontWeight: 600 }}>{location.name}</span>
                  </p>
                )}
                {(hasLocations
                  ? clinic.doctors.filter((d) => !d.location_ids?.length || d.location_ids.includes(location?.id))
                  : clinic.doctors
                ).map((d) => (
                  <button key={d.id} onClick={() => { setDoc(d); setStep(2); }}
                    className="w-full rounded-2xl p-4 text-left flex items-start gap-4 transition-all"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#93c5fd";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(37,99,235,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                    }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                      {d.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{d.full_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{d.specialty}</p>
                      {d.bio && <p className="text-xs mt-1 line-clamp-2" style={{ color: "#cbd5e1" }}>{d.bio}</p>}
                      <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                        Consulta: {d.consultation_duration} min
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Paso 2: Fecha */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#475569" }}>
                    Selecciona una fecha
                  </p>
                  {clinic.doctors.length > 1 && (
                    <button onClick={() => { setStep(1); setDoc(null); setDate(""); setSlots([]); }}
                      className="text-xs" style={{ color: "#94a3b8" }}>
                      ← Cambiar doctor
                    </button>
                  )}
                </div>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Doctor: <span style={{ color: "#475569" }}>{doctor?.full_name}</span>
                </p>
                <Calendar value={date} onChange={(d) => { handleDateChange(d); setStep(3); }} />
              </div>
            )}

            {/* Paso 3: Hora */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#475569" }}>
                    Selecciona un horario
                  </p>
                  <button onClick={() => { setStep(2); setSlot(null); }}
                    className="text-xs" style={{ color: "#94a3b8" }}>
                    ← Cambiar fecha
                  </button>
                </div>
                <p className="text-xs capitalize" style={{ color: "#94a3b8" }}>
                  {new Date(date + "T12:00:00").toLocaleDateString("es-GT", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                {loadSlots ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="rounded-2xl py-10 text-center"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>
                      Sin horarios disponibles para este día
                    </p>
                    <button onClick={() => setStep(2)}
                      className="text-xs mt-3 block mx-auto" style={{ color: "#2563eb" }}>
                      Elegir otra fecha
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const sel = slot?.starts_at === s.starts_at;
                      return (
                        <button key={s.starts_at} onClick={() => { setSlot(s); setStep(4); }}
                          className="text-sm font-semibold py-3 rounded-xl transition-all"
                          style={sel
                            ? { backgroundColor: "#2563eb", color: "#fff", border: "1px solid #2563eb" }
                            : { backgroundColor: "#ffffff", color: "#475569", border: "1px solid #e2e8f0" }}
                          onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.backgroundColor = "#eff6ff"; } }}
                          onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.backgroundColor = "#ffffff"; } }}>
                          {s.starts_at}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Paso 4: Datos */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "#475569" }}>
                    {isVet ? "Datos del responsable" : "Tus datos de contacto"}
                  </p>
                  <button onClick={() => { setStep(3); setSlot(null); }}
                    className="text-xs" style={{ color: "#94a3b8" }}>
                    ← Cambiar horario
                  </button>
                </div>

                {/* Resumen */}
                <div className="rounded-xl p-4 space-y-1.5"
                  style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  {location && (
                    <p className="text-xs" style={{ color: "#475569" }}>
                      <span className="font-medium">Sede: </span>{location.name}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: "#475569" }}>
                    <span className="font-medium">Doctor: </span>{doctor?.full_name}
                  </p>
                  <p className="text-xs" style={{ color: "#475569" }}>
                    <span className="font-medium">Fecha: </span>
                    {new Date(date + "T12:00:00").toLocaleDateString("es-GT", {
                      day: "numeric", month: "long", year: "numeric",
                    })} · {slot?.starts_at}
                  </p>
                </div>

                {/* Formulario */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        {isVet ? "Nombre del responsable" : "Nombre"} <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input type="text" value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        placeholder="Nombre"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        {isVet ? "Apellido del responsable" : "Apellido"} <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input type="text" value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        placeholder="Apellido"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inp} />
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
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        Correo <span style={{ color: "#94a3b8" }}>(opcional)</span>
                      </label>
                      <input type="email" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="correo@ejemplo.com"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inp} />
                    </div>
                  </div>

                  {/* Nombre del paciente — veterinaria */}
                  {isVet && (
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                        Nombre del paciente (animal) <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input type="text" value={form.patient_name}
                        onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                        placeholder="Ej: Firulais"
                        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inp} />
                    </div>
                  )}

                  {/* Adulto / menor — pediatría */}
                  {isPediatric && (
                    <div className="space-y-3">
                      <p className="text-xs font-medium" style={{ color: "#64748b" }}>
                        La cita es para <span style={{ color: "#ef4444" }}>*</span>
                      </p>
                      <div className="flex gap-3">
                        {[{ val: false, label: "Un adulto" }, { val: true, label: "Un menor de edad" }].map(({ val, label }) => {
                          const active = form.is_minor === val;
                          return (
                            <button key={label} type="button"
                              onClick={() => setForm({ ...form, is_minor: val, patient_name: "" })}
                              className="flex-1 text-sm py-2.5 rounded-xl font-medium transition-all"
                              style={active
                                ? { backgroundColor: "#2563eb", color: "#fff", border: "1px solid #2563eb" }
                                : { backgroundColor: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0" }}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      {form.is_minor === true && (
                        <div>
                          <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                            Nombre del paciente (menor) <span style={{ color: "#ef4444" }}>*</span>
                          </label>
                          <input type="text" value={form.patient_name}
                            onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                            placeholder="Nombre completo del menor"
                            className="w-full text-sm px-3 py-2.5 rounded-xl outline-none" style={inp} />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "#64748b" }}>
                      Motivo de consulta <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="Describe brevemente el motivo de tu consulta..."
                      rows={3}
                      className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
                      style={inp} />
                  </div>
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg"
                    style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                    {error}
                  </p>
                )}

                <button onClick={handleSubmit}
                  disabled={
                    submitting || !form.first_name || !form.last_name || !form.phone || !form.reason ||
                    (isVet && !form.patient_name) ||
                    (isPediatric && form.is_minor === null) ||
                    (isPediatric && form.is_minor === true && !form.patient_name)
                  }
                  className="w-full text-sm font-bold py-3.5 rounded-xl disabled:opacity-50"
                  style={{ backgroundColor: "#2563eb", color: "#fff" }}>
                  {submitting ? "Enviando solicitud..." : "Solicitar cita"}
                </button>
                <p className="text-xs text-center" style={{ color: "#cbd5e1" }}>
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
