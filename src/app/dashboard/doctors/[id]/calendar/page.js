"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

const STATUS_CONFIG = {
  pending:     { label: "Pendiente",  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  confirmed:   { label: "Confirmada", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  completed:   { label: "Completada", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  cancelled:   { label: "Cancelada",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  in_progress: { label: "En curso",   color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
  no_show:     { label: "No asistió", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

// Determina el rango de horas a mostrar según los horarios del doctor
function getHourRange(schedules) {
  const active = schedules?.filter((s) => s.is_active) || [];
  if (!active.length) return { minHour: 7, maxHour: 19 };
  const starts = active.map((s) => parseInt(s.start_time.split(":")[0]));
  const ends   = active.map((s) => parseInt(s.end_time.split(":")[0]));
  return {
    minHour: Math.max(0, Math.min(...starts) - 1),
    maxHour: Math.min(23, Math.max(...ends) + 1),
  };
}

// Retorna true si la hora está dentro del horario del doctor para ese día
function isWorkingSlot(day, hour, schedules) {
  const dayName  = DAY_NAMES[day.getDay()];
  const schedule = schedules?.find((s) => s.day_of_week === dayName && s.is_active);
  if (!schedule) return false;
  const startH = parseInt(schedule.start_time.split(":")[0]);
  const endH   = parseInt(schedule.end_time.split(":")[0]);
  return hour >= startH && hour < endH;
}

export default function DoctorCalendarPage() {
  const { id } = useParams();

  const [doctor,              setDoctor]              = useState(null);
  const [appointments,        setAppointments]        = useState([]);
  const [appointmentsToday,   setAppointmentsToday]   = useState(0);
  const [loading,             setLoading]             = useState(true);
  const [currentDate,         setCurrentDate]         = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newSlot,             setNewSlot]             = useState(null);

  useEffect(() => { fetchWeek(); }, [currentDate]);

  const fetchWeek = async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split("T")[0];
      const res = await api.get(`/api/v1/doctors/${id}/weekly_appointments`, { params: { date: dateStr } });
      setDoctor(res.data.doctor);
      setAppointments(res.data.appointments);
      setAppointmentsToday(res.data.appointments_today ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const [year, month, day] = currentDate.toISOString().split("T")[0].split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const diff = date.getDate() - date.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(date);
      d.setDate(diff + i);
      return d;
    });
  };

  const prevWeek  = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek  = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const goToToday = () => setCurrentDate(new Date());

  const toDateStr = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const getAptsForSlot = (day, hour) => {
    const dayStr = toDateStr(day);
    return appointments.filter((a) => a.date === dayStr && parseInt(a.time.split(":")[0]) === hour);
  };

  const handleSlotClick = (day, hour) => {
    const slotTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
    if (slotTime < new Date()) return;
    setNewSlot({ date: toDateStr(day), time: `${String(hour).padStart(2, "0")}:00`, doctor_id: id });
  };

  const weekDays = getWeekDays();
  const todayStr = toDateStr(new Date());

  const formatWeekRange = () => {
    const s = weekDays[0], e = weekDays[6];
    return `${s.getDate()} ${s.toLocaleDateString("es-GT", { month: "short" })} — ${e.getDate()} ${e.toLocaleDateString("es-GT", { month: "short", year: "numeric" })}`;
  };

  const schedules       = doctor?.schedules || [];
  const { minHour, maxHour } = getHourRange(schedules);
  const HOURS = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
  const weekTotal = appointments.length;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/doctors">
            <button className="text-sm px-3 py-1.5 rounded-lg"
              style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
              ← Volver
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Calendario</h1>
            {doctor && (
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                {doctor.full_name}
                {doctor.specialty && <span style={{ color: "#94a3b8" }}> · {doctor.specialty}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-3 mr-2">
            <div className="text-center">
              <p className="text-lg font-bold leading-none" style={{ color: "#0f172a" }}>{appointmentsToday}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Hoy</p>
            </div>
            <div style={{ width: 1, height: 28, backgroundColor: "#e2e8f0" }} />
            <div className="text-center">
              <p className="text-lg font-bold leading-none" style={{ color: "#0f172a" }}>{weekTotal}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Esta semana</p>
            </div>
          </div>

          <button onClick={prevWeek} className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
            ←
          </button>
          <button onClick={goToToday} className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
            Hoy
          </button>
          <button onClick={nextWeek} className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
            →
          </button>
          <span className="text-sm font-medium ml-1" style={{ color: "#0f172a" }}>
            {formatWeekRange()}
          </span>
        </div>
      </div>

      {/* Calendario — ocupa toda la altura restante */}
      <div className="rounded-xl overflow-hidden flex flex-col flex-1 min-h-0"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>

        {/* Header días — fijo */}
        <div className="grid flex-shrink-0"
          style={{ gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ backgroundColor: "#f8fafc" }} />
          {weekDays.map((day, i) => {
            const dStr    = toDateStr(day);
            const isToday = dStr === todayStr;
            const hasWork = schedules.some((s) => s.day_of_week === DAY_NAMES[day.getDay()] && s.is_active);
            return (
              <div key={i} className="py-3 text-center"
                style={{
                  backgroundColor: isToday ? "#eff6ff" : "#f8fafc",
                  borderLeft: "1px solid #e2e8f0",
                  opacity: hasWork || schedules.length === 0 ? 1 : 0.5,
                }}>
                <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{DAYS[day.getDay()]}</p>
                <p className="text-base font-bold mt-0.5" style={{ color: isToday ? "#2563eb" : "#0f172a" }}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Grid horas — scrolleable */}
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {HOURS.map((hour) => (
              <div key={hour} className="grid"
                style={{
                  gridTemplateColumns: "56px repeat(7, 1fr)",
                  borderBottom: "1px solid #f1f5f9",
                  minHeight: "60px",
                }}>
                {/* Label hora */}
                <div className="flex items-start justify-end pr-2 pt-1 flex-shrink-0"
                  style={{ backgroundColor: "#f8fafc", borderRight: "1px solid #e2e8f0" }}>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>{String(hour).padStart(2,"0")}:00</span>
                </div>

                {/* Celdas por día */}
                {weekDays.map((day, dayIdx) => {
                  const slotApts  = getAptsForSlot(day, hour);
                  const working   = schedules.length === 0 || isWorkingSlot(day, hour, schedules);
                  const dStr      = toDateStr(day);
                  const slotTime  = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
                  const isPast    = slotTime < new Date();
                  const isToday   = dStr === todayStr;
                  const canClick  = !isPast && slotApts.length === 0 && working;

                  return (
                    <div key={dayIdx}
                      className="p-1"
                      style={{
                        borderLeft: "1px solid #f1f5f9",
                        backgroundColor: !working
                          ? "#f8fafc"
                          : isToday
                            ? "rgba(239,246,255,0.4)"
                            : "transparent",
                        cursor: canClick ? "pointer" : "default",
                        transition: "background-color 0.1s",
                      }}
                      onClick={() => canClick && handleSlotClick(day, hour)}
                      onMouseEnter={(e) => {
                        if (canClick) e.currentTarget.style.backgroundColor = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = !working
                          ? "#f8fafc"
                          : isToday
                            ? "rgba(239,246,255,0.4)"
                            : "transparent";
                      }}
                    >
                      {slotApts.map((apt) => {
                        const st = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
                        return (
                          <button
                            key={apt.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                            className="w-full text-left rounded-lg px-2 py-1.5 mb-1"
                            style={{ backgroundColor: st.bg, border: `1px solid ${st.border}` }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          >
                            <p className="text-xs font-semibold truncate" style={{ color: st.color }}>
                              {apt.time} — {apt.patient_name}
                            </p>
                            <p className="text-xs truncate" style={{ color: "#64748b" }}>{apt.reason}</p>
                          </button>
                        );
                      })}
                      {/* Indicador de hora fuera de horario */}
                      {!working && (
                        <div className="h-full w-full flex items-center justify-center" style={{ minHeight: "40px" }}>
                          <div style={{ width: "100%", height: "1px", backgroundColor: "#e2e8f0" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal detalle cita */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAppointment(null); }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Detalle de cita</h2>
              <button onClick={() => setSelectedAppointment(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ color: "#94a3b8", backgroundColor: "#f1f5f9" }}>✕</button>
            </div>
            {(() => {
              const st = STATUS_CONFIG[selectedAppointment.status] || STATUS_CONFIG.pending;
              return (
                <div className="space-y-4">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ color: st.color, backgroundColor: st.bg, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                  <div className="rounded-lg p-4 space-y-3"
                    style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    {[
                      ["Paciente", selectedAppointment.patient_name],
                      ["Responsable", selectedAppointment.owner_name],
                      ["Hora", selectedAppointment.time],
                      ["Motivo", selectedAppointment.reason],
                    ].map(([label, value]) => value ? (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#94a3b8" }}>{label}</span>
                        <span className="text-sm font-medium" style={{ color: "#0f172a" }}>{value}</span>
                      </div>
                    ) : null)}
                  </div>
                  <div className="flex gap-3">
                    <Link href="/dashboard/appointments" className="flex-1">
                      <button className="w-full py-2.5 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                        onClick={() => setSelectedAppointment(null)}>
                        Ver en citas
                      </button>
                    </Link>
                    <button onClick={() => setSelectedAppointment(null)}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                      Cerrar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal nuevo slot */}
      {newSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setNewSlot(null); }}>
          <div className="rounded-xl p-6 w-full max-w-md shadow-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#0f172a" }}>Nueva cita</h2>
                <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                  {(() => {
                    const [y,m,d] = newSlot.date.split("-").map(Number);
                    return new Date(y,m-1,d).toLocaleDateString("es-GT",{ weekday:"long", day:"numeric", month:"long" });
                  })()} · {newSlot.time}
                </p>
              </div>
              <button onClick={() => setNewSlot(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ color: "#94a3b8", backgroundColor: "#f1f5f9" }}>✕</button>
            </div>
            <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {(() => {
                  const [y,m,d] = newSlot.date.split("-").map(Number);
                  return new Date(y,m-1,d).toLocaleDateString("es-GT",{ weekday:"long", day:"numeric", month:"long", year:"numeric" });
                })()}
              </p>
              <p className="text-sm mt-1" style={{ color: "#1d4ed8" }}>
                {newSlot.time} hrs · {doctor?.full_name}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/dashboard/appointments/new?doctor_id=${newSlot.doctor_id}&date=${newSlot.date}&time=${newSlot.time}`} className="flex-1">
                <button className="w-full py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                  onClick={() => setNewSlot(null)}>
                  Continuar →
                </button>
              </Link>
              <button onClick={() => setNewSlot(null)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
