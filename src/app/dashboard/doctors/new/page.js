"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";

const DAY_DEFAULTS = [
  { day: 1, name: "Lunes",     start: "08:00", end: "17:00" },
  { day: 2, name: "Martes",    start: "08:00", end: "17:00" },
  { day: 3, name: "Miércoles", start: "08:00", end: "17:00" },
  { day: 4, name: "Jueves",    start: "08:00", end: "17:00" },
  { day: 5, name: "Viernes",   start: "08:00", end: "17:00" },
  { day: 6, name: "Sábado",    start: "08:00", end: "13:00" },
  { day: 0, name: "Domingo",   start: "08:00", end: "13:00" },
];

function makeBlankDays(locationId) {
  return DAY_DEFAULTS.map((d) => ({ ...d, active: false, location_id: locationId }));
}

export default function NewDoctorPage() {
  const router = useRouter();
  const { fetchMe, organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [form, setForm] = useState({
    user: { first_name: "", last_name: "", email: "", phone: "", password: "", password_confirmation: "" },
    doctor: { specialty: "", license_number: "", bio: "", consultation_duration: 30 },
  });

  const [locations, setLocations]           = useState([]);
  const [locationIds, setLocationIds]       = useState([]);
  const [activeScheduleTab, setActiveTab]   = useState(null);
  const [schedules, setSchedules]           = useState(makeBlankDays(null));

  const [error, setError]   = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/v1/locations")
      .then((r) => {
        const locs = r.data;
        setLocations(locs);
        if (locs.length === 1) {
          // Única sede → auto-asignar y preparar horario
          setLocationIds([locs[0].id]);
          setSchedules(makeBlankDays(locs[0].id));
          setActiveTab(locs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleTabChange = (locId) => {
    if (locId !== null) {
      const hasEntries = schedules.some((s) => s.location_id === locId);
      if (!hasEntries) setSchedules((prev) => [...prev, ...makeBlankDays(locId)]);
    }
    setActiveTab(locId);
  };

  const handleLocationToggle = (locId, checked) => {
    if (checked) {
      // Deseleccionar
      if (activeScheduleTab === locId) {
        const remaining = locationIds.filter((id) => id !== locId);
        setActiveTab(remaining.length > 0 ? remaining[0] : null);
      }
      setLocationIds((ids) => ids.filter((id) => id !== locId));
    } else {
      // Seleccionar
      setLocationIds((ids) => [...ids, locId]);
      handleTabChange(locId);
    }
  };

  const handleUser   = (f, v) => setForm((prev) => ({ ...prev, user: { ...prev.user, [f]: v } }));
  const handleDoctor = (f, v) => setForm((prev) => ({ ...prev, doctor: { ...prev.doctor, [f]: v } }));

  const toggleDay = (index) => {
    setSchedules((s) => s.map((item, i) => i === index ? { ...item, active: !item.active } : item));
  };

  const updateSchedule = (index, field, value) => {
    setSchedules((s) => s.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors([]);

    if (locations.length > 0 && locationIds.length === 0) {
      setErrors(["Debes asignar al menos una sede al especialista."]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/v1/doctors", {
        user: form.user,
        doctor: {
          specialty:             form.doctor.specialty,
          license_number:        form.doctor.license_number,
          bio:                   form.doctor.bio,
          consultation_duration: parseInt(form.doctor.consultation_duration),
          location_ids:          locationIds,
        },
        schedules: schedules
          .filter((s) => s.active)
          .map((s) => ({
            day_of_week: s.day,
            start_time:  s.start,
            end_time:    s.end,
            location_id: s.location_id,
          })),
      });

      toast.success(res.data?.reactivated
        ? `${config.staffSingularLabel} reactivado correctamente`
        : `${config.staffSingularLabel} creado correctamente`
      );
      await fetchMe();
      router.push("/dashboard/doctors");
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      else setError(err.response?.data?.error || "Error al crear el doctor");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const labelStyle = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };

  const visibleSchedules = schedules.filter((s) => s.location_id === activeScheduleTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/doctors">
          <button className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            ← Volver
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
            Nuevo {config.staffSingularLabel}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Registra un nuevo {config.staffSingularLabel} en la clínica
          </p>
        </div>
      </div>

      {(error || errors.length > 0) && (
        <div className="px-4 py-3 rounded-lg text-sm"
          style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {error && <p>{error}</p>}
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Datos personales */}
          <div className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Datos personales
            </p>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input type="text" value={form.user.first_name}
                onChange={(e) => handleUser("first_name", e.target.value)}
                placeholder="Roberto" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Apellido *</label>
              <input type="text" value={form.user.last_name}
                onChange={(e) => handleUser("last_name", e.target.value)}
                placeholder="Méndez" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.user.email}
                onChange={(e) => handleUser("email", e.target.value)}
                placeholder="doctor@clinica.com" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input type="text" value={form.user.phone}
                onChange={(e) => handleUser("phone", e.target.value)}
                placeholder="55551234" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contraseña temporal *</label>
              <input type="password" value={form.user.password}
                onChange={(e) => { handleUser("password", e.target.value); handleUser("password_confirmation", e.target.value); }}
                placeholder="********" style={inputStyle} required />
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                El {config.staffSingularLabel} podrá cambiarla desde su perfil
              </p>
            </div>
          </div>

          {/* Datos profesionales */}
          <div className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Datos profesionales
            </p>
            <div>
              <label style={labelStyle}>Especialidad *</label>
              <input type="text" value={form.doctor.specialty}
                onChange={(e) => handleDoctor("specialty", e.target.value)}
                placeholder={`Especialidad del ${config.staffSingularLabel}`}
                style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Número de cédula / licencia</label>
              <input type="text" value={form.doctor.license_number}
                onChange={(e) => handleDoctor("license_number", e.target.value)}
                placeholder="Cédula o colegiado" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Duración de consulta *</label>
              <select value={form.doctor.consultation_duration}
                onChange={(e) => handleDoctor("consultation_duration", e.target.value)}
                style={inputStyle} required>
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
              </select>
            </div>

            {/* Sedes — solo si la org tiene */}
            {locations.length > 1 && (
              <div>
                <label style={labelStyle}>
                  Sedes donde atiende <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>
                  Selecciona al menos una sede
                </p>
                <div className="space-y-2">
                  {locations.map((loc) => {
                    const checked = locationIds.includes(loc.id);
                    return (
                      <label key={loc.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg"
                        style={{ border: `1px solid ${checked ? "#bfdbfe" : "#e2e8f0"}`, backgroundColor: checked ? "#eff6ff" : "#f8fafc" }}>
                        <input type="checkbox" checked={checked}
                          onChange={() => handleLocationToggle(loc.id, checked)}
                          style={{ width: "16px", height: "16px", accentColor: "#2563eb" }} />
                        <span style={{ fontSize: "13px", fontWeight: checked ? "600" : "400", color: checked ? "#1d4ed8" : "#374151" }}>
                          {loc.name}{loc.city ? ` — ${loc.city}` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {locations.length === 1 && (
              <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <p className="text-xs" style={{ color: "#166534" }}>
                  Sede asignada automáticamente: <span style={{ fontWeight: 600 }}>{locations[0].name}</span>
                </p>
              </div>
            )}

            <div>
              <label style={labelStyle}>Biografía</label>
              <textarea value={form.doctor.bio}
                onChange={(e) => handleDoctor("bio", e.target.value)}
                placeholder={`Biografía del ${config.staffSingularLabel}...`}
                rows={3} style={{ ...inputStyle, resize: "none" }} />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
            Días y horarios de atención
          </p>

          {/* Sin sede asignada y hay sedes en la org */}
          {locations.length > 0 && locationIds.length === 0 ? (
            <div className="rounded-lg px-4 py-6 text-center" style={{ backgroundColor: "#fafafa", border: "1px dashed #e2e8f0" }}>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                Asigna al menos una sede para configurar el horario
              </p>
            </div>
          ) : (
            <>
              {/* Tabs por sede — solo cuando hay múltiples sedes asignadas */}
              {locationIds.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {locations.filter((l) => locationIds.includes(l.id)).map((loc) => (
                    <button key={loc.id} type="button" onClick={() => handleTabChange(loc.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={activeScheduleTab === loc.id
                        ? { backgroundColor: "#2563eb", color: "#fff" }
                        : { backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                      {loc.name}
                    </button>
                  ))}
                  {activeScheduleTab !== null && (
                    <p className="w-full text-xs" style={{ color: "#94a3b8" }}>
                      Horario para {locations.find((l) => l.id === activeScheduleTab)?.name}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {visibleSchedules.map((schedule) => {
                  const index = schedules.findIndex((s) => s.day === schedule.day && s.location_id === activeScheduleTab);
                  return (
                    <div key={`${schedule.day}-${activeScheduleTab}`} className="flex items-center gap-4">
                      <button type="button" onClick={() => toggleDay(index)}
                        className="w-24 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                        style={{
                          backgroundColor: schedule.active ? "#2563eb" : "#f1f5f9",
                          color: schedule.active ? "#ffffff" : "#64748b",
                          border: `1px solid ${schedule.active ? "#2563eb" : "#e2e8f0"}`,
                        }}>
                        {schedule.name}
                      </button>
                      {schedule.active && (
                        <>
                          <input type="time" value={schedule.start}
                            onChange={(e) => updateSchedule(index, "start", e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg outline-none"
                            style={{ border: "1px solid #e2e8f0", color: "#0f172a" }} />
                          <span className="text-xs" style={{ color: "#94a3b8" }}>a</span>
                          <input type="time" value={schedule.end}
                            onChange={(e) => updateSchedule(index, "end", e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg outline-none"
                            style={{ border: "1px solid #e2e8f0", color: "#0f172a" }} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: loading ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? `Creando ${config.staffSingularLabel}...` : `Crear ${config.staffSingularLabel}`}
          </button>
          <Link href="/dashboard/doctors">
            <button type="button" className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
