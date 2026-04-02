"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFeature } from "@/lib/useFeature";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function EditDoctorPage() {
  const router = useRouter();
  const { id } = useParams();
  const hasInventory = useFeature("inventory");
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const [form, setForm] = useState({
    specialty: "",
    license_number: "",
    bio: "",
    consultation_duration: 30,
    status: "active",
    inventory_movements: false,
  });

  const [schedules, setSchedules] = useState([
    {
      day: 1,
      name: "Lunes",
      active: false,
      start: "08:00",
      end: "17:00",
      id: null,
    },
    {
      day: 2,
      name: "Martes",
      active: false,
      start: "08:00",
      end: "17:00",
      id: null,
    },
    {
      day: 3,
      name: "Miércoles",
      active: false,
      start: "08:00",
      end: "17:00",
      id: null,
    },
    {
      day: 4,
      name: "Jueves",
      active: false,
      start: "08:00",
      end: "17:00",
      id: null,
    },
    {
      day: 5,
      name: "Viernes",
      active: false,
      start: "08:00",
      end: "17:00",
      id: null,
    },
    {
      day: 6,
      name: "Sábado",
      active: false,
      start: "08:00",
      end: "13:00",
      id: null,
    },
    {
      day: 0,
      name: "Domingo",
      active: false,
      start: "08:00",
      end: "13:00",
      id: null,
    },
  ]);

  const [doctor, setDoctor] = useState(null);

  useEffect(() => {
    fetchDoctor();
  }, []);

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
        status: d.status || "active",
        inventory_movements: d.inventory_movements || false,
      });

      // Mapear horarios existentes
      if (d.schedules?.length > 0) {
        setSchedules((prev) =>
          prev.map((slot) => {
            const existing = d.schedules.find((s) => {
              const dayMap = {
                monday: 1,
                tuesday: 2,
                wednesday: 3,
                thursday: 4,
                friday: 5,
                saturday: 6,
                sunday: 0,
              };
              return dayMap[s.day_of_week] === slot.day;
            });
            if (existing) {
              return {
                ...slot,
                active: existing.is_active,
                start: existing.start_time,
                end: existing.end_time,
                id: existing.id,
              };
            }
            return slot;
          }),
        );
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      // Actualizar datos del doctor
      await api.patch(`/api/v1/doctors/${id}`, { doctor: form });

      // Manejar horarios
      const activeSchedules = schedules.filter((s) => s.active);
      const inactiveSchedules = schedules.filter((s) => !s.active && s.id);

      // Crear o actualizar horarios activos
      await Promise.all(
        activeSchedules.map((s) => {
          if (s.id) {
            return api.patch(`/api/v1/doctors/${id}/schedules/${s.id}`, {
              schedule: {
                start_time: s.start,
                end_time: s.end,
                is_active: true,
              },
            });
          } else {
            return api.post(`/api/v1/doctors/${id}/schedules`, {
              schedule: {
                day_of_week: s.day,
                start_time: s.start,
                end_time: s.end,
                is_active: true,
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
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Días y horarios de atención
            </p>

            <div className="space-y-3">
              {schedules.map((schedule, index) => (
                <div key={schedule.day} className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleDay(index)}
                    className="w-24 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                    style={{
                      backgroundColor: schedule.active ? "#2563eb" : "#f1f5f9",
                      color: schedule.active ? "#ffffff" : "#64748b",
                      border: `1px solid ${schedule.active ? "#2563eb" : "#e2e8f0"}`,
                    }}
                  >
                    {schedule.name}
                  </button>

                  {schedule.active && (
                    <>
                      <input
                        type="time"
                        value={schedule.start}
                        onChange={(e) =>
                          updateSchedule(index, "start", e.target.value)
                        }
                        className="text-sm px-3 py-1.5 rounded-lg outline-none"
                        style={{
                          border: "1px solid #e2e8f0",
                          color: "#0f172a",
                        }}
                      />
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        a
                      </span>
                      <input
                        type="time"
                        value={schedule.end}
                        onChange={(e) =>
                          updateSchedule(index, "end", e.target.value)
                        }
                        className="text-sm px-3 py-1.5 rounded-lg outline-none"
                        style={{
                          border: "1px solid #e2e8f0",
                          color: "#0f172a",
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
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
