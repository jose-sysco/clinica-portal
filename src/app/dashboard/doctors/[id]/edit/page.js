"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFeature } from "@/lib/useFeature";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const DAY_DEFAULTS = [
  { day: 1, name: "Lunes",     start: "08:00", end: "17:00" },
  { day: 2, name: "Martes",    start: "08:00", end: "17:00" },
  { day: 3, name: "Miércoles", start: "08:00", end: "17:00" },
  { day: 4, name: "Jueves",    start: "08:00", end: "17:00" },
  { day: 5, name: "Viernes",   start: "08:00", end: "17:00" },
  { day: 6, name: "Sábado",    start: "08:00", end: "13:00" },
  { day: 0, name: "Domingo",   start: "08:00", end: "13:00" },
];

const DAY_MAP = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };

function makeBlankDays(locationId) {
  return DAY_DEFAULTS.map((d) => ({ ...d, active: false, id: null, location_id: locationId }));
}

export default function EditDoctorPage() {
  const router = useRouter();
  const { id } = useParams();
  const hasInventory = useFeature("inventory");
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    specialty: "",
    license_number: "",
    bio: "",
    consultation_duration: 30,
    consultation_fee: "",
    card_surcharge_percent: "",
    status: "active",
    inventory_movements: false,
    location_ids: [],
  });
  const [activeScheduleTab, setActiveScheduleTab] = useState(null); // null = global

  const [schedules, setSchedules] = useState(makeBlankDays(null));

  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    fetchDoctor();
    api.get("/api/v1/locations").then((r) => setLocations(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!loading && locations.length > 0) {
      let currentIds = form.location_ids;

      // Si org tiene 1 sola sede y el doctor no tiene ninguna → auto-asignar
      if (locations.length === 1 && form.location_ids.length === 0) {
        currentIds = [locations[0].id];
        setForm((f) => ({ ...f, location_ids: currentIds }));
      }

      // Auto-seleccionar primer tab si tiene sedes asignadas
      if (currentIds.length > 0 && activeScheduleTab === null) {
        const relevant = locations.filter((l) => currentIds.includes(l.id));
        if (relevant.length > 0) handleTabChange(relevant[0].id);
      }
    }
  }, [loading, locations]);

  const fetchDoctor = async () => {
    try {
      const res = await api.get(`/api/v1/doctors/${id}`);
      const d = res.data;
      setDoctor(d);
      setForm({
        specialty: d.specialty || "",
        license_number: d.license_number || "",
        bio: d.bio || "",
        consultation_duration: d.consultation_duration || 30,
        consultation_fee: d.consultation_fee ?? "",
        card_surcharge_percent: d.card_surcharge_percent ?? "",
        status: d.status || "active",
        inventory_movements: d.inventory_movements || false,
        location_ids: d.location_ids || [],
      });

      // Build a flat schedules array: 7 days for each location group (null = global)
      const apiSchedules = d.schedules || [];

      const mergeIntoSlots = (locId, apiSlots) =>
        DAY_DEFAULTS.map((def) => {
          const existing = apiSlots.find((s) => DAY_MAP[s.day_of_week] === def.day);
          return existing
            ? { ...def, active: existing.is_active, start: existing.start_time, end: existing.end_time, id: existing.id, location_id: locId }
            : { ...def, active: false, id: null, location_id: locId };
        });

      // Group by location_id (null for global)
      const groups = {};
      apiSchedules.forEach((s) => {
        const key = s.location_id ?? null;
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });

      // Always include global group
      if (!groups[null]) groups[null] = [];

      const built = Object.entries(groups).flatMap(([key, slots]) => {
        const locId = key === "null" || key === null ? null : Number(key);
        return mergeIntoSlots(locId, slots);
      });

      setSchedules(built);
    } catch (err) {
      toast.error("Error al cargar el doctor");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (index) => {
    setSchedules((s) =>
      s.map((item, i) =>
        i === index ? { ...item, active: !item.active } : item,
      ),
    );
  };

  const updateSchedule = (index, field, value) => {
    setSchedules((s) =>
      s.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleTabChange = (locId) => {
    if (locId !== null) {
      const hasEntries = schedules.some((s) => s.location_id === locId);
      if (!hasEntries) {
        setSchedules((prev) => [...prev, ...makeBlankDays(locId)]);
      }
    }
    setActiveScheduleTab(locId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (locations.length > 0 && form.location_ids.length === 0) {
      setErrors(["Debes asignar al menos una sede al especialista antes de guardar."]);
      return;
    }

    setSubmitting(true);

    try {
      // Actualizar datos del doctor (incluye location_ids para sincronizar sedes)
      await api.patch(`/api/v1/doctors/${id}`, { doctor: form });

      // Manejar horarios de TODOS los tabs (global + por sede)
      const activeSchedules = schedules.filter((s) => s.active);
      const inactiveSchedules = schedules.filter((s) => !s.active && s.id);

      // Crear o actualizar horarios activos
      await Promise.all(
        activeSchedules.map((s) => {
          if (s.id) {
            return api.patch(`/api/v1/doctors/${id}/schedules/${s.id}`, {
              schedule: { start_time: s.start, end_time: s.end, is_active: true },
            });
          } else {
            return api.post(`/api/v1/doctors/${id}/schedules`, {
              schedule: {
                day_of_week: s.day,
                start_time: s.start,
                end_time: s.end,
                is_active: true,
                location_id: s.location_id,
              },
            });
          }
        }),
      );

      // Desactivar horarios que se quitaron
      await Promise.all(
        inactiveSchedules.map((s) =>
          api.patch(`/api/v1/doctors/${id}/schedules/${s.id}`, {
            schedule: { is_active: false },
          }),
        ),
      );

      toast.success(`${config.staffSingularLabel} actualizado correctamente`);
      router.push("/dashboard/doctors");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(`Error al actualizar el ${config.staffSingularLabel?.toLowerCase()}`);
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
        <Link href="/dashboard/doctors">
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
            Editar {config.staffLabel}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {doctor?.full_name} · {doctor?.email}
          </p>
        </div>
      </div>
      <Link href={`/dashboard/doctors/${id}/schedule`}>
        <button
          className="text-sm font-medium px-4 py-2 rounded-lg"
          style={{
            color: "#2563eb",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#dbeafe")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#eff6ff")
          }
        >
          Gestionar horario →
        </button>
      </Link>

      {errors.length > 0 && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Datos profesionales */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Datos profesionales
            </p>

            <div>
              <label style={labelStyle}>Especialidad *</label>
              <input
                type="text"
                value={form.specialty}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specialty: e.target.value }))
                }
                placeholder="Medicina General"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Número de cédula / licencia</label>
              <input
                type="text"
                value={form.license_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, license_number: e.target.value }))
                }
                placeholder="VET-001"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Tarifa de consulta</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}>Q</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.consultation_fee}
                  onChange={(e) => setForm((f) => ({ ...f, consultation_fee: e.target.value }))}
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: "28px" }}
                />
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Se usa para calcular el estado de pago por cita
              </p>
            </div>

            <div>
              <label style={labelStyle}>Recargo por pago con tarjeta (%)</label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.card_surcharge_percent}
                  onChange={(e) => setForm((f) => ({ ...f, card_surcharge_percent: e.target.value }))}
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingRight: "28px" }}
                />
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: "14px" }}>%</span>
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                Se aplica automáticamente al seleccionar tarjeta como método de pago
              </p>
            </div>

            <div>
              <label style={labelStyle}>Duración de consulta *</label>
              <select
                value={form.consultation_duration}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    consultation_duration: parseInt(e.target.value),
                  }))
                }
                style={inputStyle}
                required
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Estado</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                style={inputStyle}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="on_leave">De permiso</option>
              </select>
            </div>

            {hasInventory && (
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#0f172a" }}
                    >
                      Movimientos de inventario
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      Al activar, los insumos usados en consultas de este{" "}
                      {config.staffLabel} se descontarán automáticamente del
                      inventario.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        inventory_movements: !f.inventory_movements,
                      }))
                    }
                    className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 overflow-hidden"
                    style={{
                      backgroundColor: form.inventory_movements
                        ? "#2563eb"
                        : "#e2e8f0",
                    }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                      style={{
                        transform: form.inventory_movements
                          ? "translateX(20px)"
                          : "translateX(0)",
                      }}
                    />
                  </button>
                </div>
              </div>
            )}

            {locations.length > 0 && (
              <div>
                <label style={labelStyle}>Sedes donde atiende</label>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>
                  Sin selección = atiende en todas las sedes
                </p>
                <div className="space-y-2">
                  {locations.map((loc) => {
                    const checked = form.location_ids.includes(loc.id);
                    return (
                      <label key={loc.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg"
                        style={{ border: `1px solid ${checked ? "#bfdbfe" : "#e2e8f0"}`, backgroundColor: checked ? "#eff6ff" : "#f8fafc" }}>
                        <input type="checkbox" checked={checked}
                          onChange={() => {
                            if (checked && activeScheduleTab === loc.id) setActiveScheduleTab(null);
                            setForm((f) => ({
                              ...f,
                              location_ids: checked
                                ? f.location_ids.filter((lid) => lid !== loc.id)
                                : [...f.location_ids, loc.id],
                            }));
                          }}
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

            <div>
              <label style={labelStyle}>Biografía</label>
              <textarea
                value={form.bio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bio: e.target.value }))
                }
                placeholder="Especialista con X años de experiencia..."
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
          </div>

          {/* Horarios */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Días y horarios de atención
            </p>

            {/* Aviso cuando atiende en todas las sedes */}
            {locations.length > 0 && form.location_ids.length === 0 && (
              <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
                <p className="text-xs" style={{ color: "#92400e" }}>
                  Este especialista atiende en todas las sedes — el horario general aplica en todas.
                  Asígnale sedes específicas para configurar horarios independientes por sede.
                </p>
              </div>
            )}

            {/* Tabs por sede — solo cuando tiene sedes asignadas */}
            {locations.length > 0 && form.location_ids.length > 0 && (() => {
              const tabLocations = locations.filter((l) => form.location_ids.includes(l.id));
              return (
                <div className="flex flex-wrap gap-2">
                  {tabLocations.map((loc) => (
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
              );
            })()}

            <div className="space-y-3">
              {schedules
                .filter((s) => s.location_id === (activeScheduleTab ?? null))
                .map((schedule, _) => {
                  const index = schedules.findIndex((s) => s.day === schedule.day && s.location_id === (activeScheduleTab ?? null));
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
          </div>
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
            {submitting ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link href="/dashboard/doctors">
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
