"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function DoctorAvailabilityPage() {
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailability();
  }, [date]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/doctors/${id}/availability`, {
        params: { date },
      });
      setDoctor(response.data.doctor);
      setSlots(response.data.slots);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar disponibilidad");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const dayName = (dateStr) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-GT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const changeDate = (days) => {
    const current = new Date(date + "T12:00:00");
    current.setDate(current.getDate() + days);
    setDate(current.toISOString().split("T")[0]);
  };

  const isToday = date === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/doctors">
          <button
            className="text-sm px-3 py-1.5 rounded-lg transition-colors"
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
            Disponibilidad
          </h1>
          {doctor && (
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {doctor.full_name}
            </p>
          )}
        </div>
      </div>

      {/* Selector de fecha */}
      <div
        className="rounded-xl p-5 shadow-sm flex items-center justify-between"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <button
          onClick={() => changeDate(-1)}
          disabled={isToday}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors disabled:opacity-40"
          style={{
            backgroundColor: "#f1f5f9",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
          }}
        >
          ←
        </button>

        <div className="text-center">
          <p
            className="text-sm font-semibold capitalize"
            style={{ color: "#0f172a" }}
          >
            {dayName(date)}
          </p>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs mt-1 border rounded px-2 py-1 outline-none"
            style={{ color: "#64748b", borderColor: "#e2e8f0" }}
          />
        </div>

        <button
          onClick={() => changeDate(1)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-colors"
          style={{
            backgroundColor: "#f1f5f9",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
          }}
        >
          →
        </button>
      </div>

      {/* Slots */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              {error}
            </p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8">
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "#0f172a" }}
            >
              Sin disponibilidad
            </p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              El {config.staffLabel} no tiene horario disponible para este día
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                Horarios disponibles
              </p>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  color: "#16a34a",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                {slots.length} disponible{slots.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {slots.map((slot, index) => (
                <Link
                  key={index}
                  href={`/dashboard/appointments/new?doctor_id=${id}&date=${date}&time=${slot.starts_at}`}
                >
                  <button
                    className="w-full py-2.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: "#eff6ff",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#eff6ff";
                      e.currentTarget.style.color = "#2563eb";
                    }}
                  >
                    {slot.starts_at}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
