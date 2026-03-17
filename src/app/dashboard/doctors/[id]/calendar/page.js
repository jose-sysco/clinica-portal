"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  confirmed: {
    label: "Confirmada",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  completed: {
    label: "Completada",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  cancelled: {
    label: "Cancelada",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  in_progress: {
    label: "En curso",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#e9d5ff",
  },
  no_show: {
    label: "No asistió",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
};

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

export default function DoctorCalendarPage() {
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState(null);

  useEffect(() => {
    fetchWeek();
  }, [currentDate]);

  const fetchWeek = async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split("T")[0];
      const res = await api.get(`/api/v1/doctors/${id}/weekly_appointments`, {
        params: { date: dateStr },
      });
      setDoctor(res.data.doctor);
      setAppointments(res.data.appointments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    // Parsear la fecha sin conversión de timezone
    const [year, month, day] = currentDate
      .toISOString()
      .split("T")[0]
      .split("-")
      .map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(date);
      d.setDate(diff + i);
      return d;
    });
  };

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToToday = () => setCurrentDate(new Date());

  const getAppointmentsForSlot = (day, hour) => {
    // Usar fecha local sin UTC
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return appointments.filter((a) => {
      const aDate = a.scheduled_at.split("T")[0];
      const aHour = parseInt(a.time.split(":")[0]);
      return aDate === dayStr && aHour === hour;
    });
  };

  const handleSlotClick = (day, hour) => {
    // Construir fecha local sin UTC
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const slotTime = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hour,
      0,
      0,
    );
    const isPast = slotTime < new Date();
    if (isPast) return;

    setNewAppointmentSlot({
      date: dayStr,
      time: `${String(hour).padStart(2, "0")}:00`,
      doctor_id: id,
    });
    setShowNewAppointment(true);
  };

  const weekDays = getWeekDays();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} ${start.toLocaleDateString("es-GT", { month: "short" })} — ${end.getDate()} ${end.toLocaleDateString("es-GT", { month: "short", year: "numeric" })}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              Calendario
            </h1>
            {doctor && (
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                {doctor.full_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "#f1f5f9",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
          >
            ← Anterior
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
          >
            Hoy
          </button>
          <button
            onClick={nextWeek}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "#f1f5f9",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
          >
            Siguiente →
          </button>
          <span
            className="text-sm font-medium ml-2"
            style={{ color: "#0f172a" }}
          >
            {formatWeekRange()}
          </span>
        </div>
      </div>

      {/* Calendario */}
      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        {/* Header días */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "60px repeat(7, 1fr)",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ backgroundColor: "#f8fafc" }} />
          {weekDays.map((day, i) => {
            // Usar fecha local
            const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
            const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
            const isToday = dayStr === todayStr;
            return (
              <div
                key={i}
                className="py-3 text-center"
                style={{
                  backgroundColor: isToday ? "#eff6ff" : "#f8fafc",
                  borderLeft: "1px solid #e2e8f0",
                }}
              >
                <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                  {DAYS[day.getDay()]}
                </p>
                <p
                  className="text-lg font-bold mt-0.5"
                  style={{ color: isToday ? "#2563eb" : "#0f172a" }}
                >
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Grid horas */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="grid"
                style={{
                  gridTemplateColumns: "60px repeat(7, 1fr)",
                  borderBottom: "1px solid #f1f5f9",
                  minHeight: "64px",
                }}
              >
                {/* Hora */}
                <div
                  className="flex items-start justify-end pr-3 pt-1"
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRight: "1px solid #e2e8f0",
                  }}
                >
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    {hour}:00
                  </span>
                </div>

                {/* Celdas por día */}
                {weekDays.map((day, dayIndex) => {
                  const slotAppointments = getAppointmentsForSlot(day, hour);
                  const dayStr = day.toISOString().split("T")[0];
                  const slotTime = new Date(
                    `${dayStr}T${String(hour).padStart(2, "0")}:00:00`,
                  );
                  const isPast = slotTime < new Date();

                  return (
                    <div
                      key={dayIndex}
                      className="p-1"
                      style={{
                        borderLeft: "1px solid #f1f5f9",
                        cursor:
                          !isPast && slotAppointments.length === 0
                            ? "pointer"
                            : "default",
                        backgroundColor: "transparent",
                        transition: "background-color 0.1s",
                      }}
                      onClick={() => {
                        if (slotAppointments.length === 0)
                          handleSlotClick(day, hour);
                      }}
                      onMouseEnter={(e) => {
                        if (!isPast && slotAppointments.length === 0) {
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {slotAppointments.map((apt) => {
                        const status =
                          statusConfig[apt.status] || statusConfig.pending;
                        return (
                          <button
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(apt);
                            }}
                            className="w-full text-left rounded-lg px-2 py-1.5 mb-1 transition-all"
                            style={{
                              backgroundColor: status.bg,
                              border: `1px solid ${status.border}`,
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.opacity = "0.8")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.opacity = "1")
                            }
                          >
                            <p
                              className="text-xs font-semibold truncate"
                              style={{ color: status.color }}
                            >
                              {apt.time} — {apt.patient_name}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "#64748b" }}
                            >
                              {apt.owner_name}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal detalle de cita existente */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAppointment(null);
          }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "#0f172a" }}>
                Detalle de cita
              </h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-sm px-2 py-1 rounded"
                style={{ color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>
            {(() => {
              const status =
                statusConfig[selectedAppointment.status] ||
                statusConfig.pending;
              return (
                <div className="space-y-4">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      color: status.color,
                      backgroundColor: status.bg,
                      border: `1px solid ${status.border}`,
                    }}
                  >
                    {status.label}
                  </span>
                  <div
                    className="rounded-lg p-4 space-y-3"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        Paciente
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {selectedAppointment.patient_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        Propietario
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {selectedAppointment.owner_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        Hora
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {selectedAppointment.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        Motivo
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {selectedAppointment.reason}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/dashboard/appointments`} className="flex-1">
                      <button
                        className="w-full py-2.5 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                        onClick={() => setSelectedAppointment(null)}
                      >
                        Ver en citas
                      </button>
                    </Link>
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      className="px-6 py-2.5 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: "#f1f5f9",
                        color: "#64748b",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal nueva cita */}
      {showNewAppointment && newAppointmentSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewAppointment(false);
          }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#0f172a" }}>
                  Nueva cita
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                  {(() => {
                    const [y, m, d] = newAppointmentSlot.date
                      .split("-")
                      .map(Number);
                    return new Date(y, m - 1, d).toLocaleDateString("es-GT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    });
                  })()}{" "}
                  · {newAppointmentSlot.time}
                </p>
              </div>
              <button
                onClick={() => setShowNewAppointment(false)}
                className="text-sm px-2 py-1 rounded"
                style={{ color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <div
              className="rounded-lg p-4 mb-5"
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "#94a3b8" }}
              >
                Slot seleccionado
              </p>
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                📅{" "}
                {(() => {
                  const [y, m, d] = newAppointmentSlot.date
                    .split("-")
                    .map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString("es-GT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                })()}
              </p>
              <p
                className="text-sm font-medium mt-1"
                style={{ color: "#0f172a" }}
              >
                ⏰ {newAppointmentSlot.time} hrs
              </p>
              <p
                className="text-sm font-medium mt-1"
                style={{ color: "#0f172a" }}
              >
                👨‍⚕️ {doctor?.full_name}
              </p>
            </div>

            <p className="text-sm mb-4" style={{ color: "#64748b" }}>
              Se abrirá el formulario de nueva cita con estos datos precargados.
            </p>

            <div className="flex gap-3">
              <Link
                href={`/dashboard/appointments/new?doctor_id=${newAppointmentSlot.doctor_id}&date=${newAppointmentSlot.date}&time=${newAppointmentSlot.time}`}
                className="flex-1"
              >
                <button
                  className="w-full py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                  onClick={() => setShowNewAppointment(false)}
                >
                  Continuar →
                </button>
              </Link>
              <button
                onClick={() => setShowNewAppointment(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
