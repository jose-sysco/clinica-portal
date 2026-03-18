"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending:   { label: "Pendiente",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  confirmed: { label: "Confirmada",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  completed: { label: "Completada",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  cancelled: { label: "Cancelada",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  no_show:   { label: "No asistió",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
};

const TYPE_LABEL = {
  first_visit:  "Primera visita",
  follow_up:    "Seguimiento",
  emergency:    "Urgencia",
  checkup:      "Control",
  procedure:    "Procedimiento",
};

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const { organization } = useAuth();
  const config  = getConfig(organization?.clinic_type);

  const [appt,         setAppt]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [cancelling,   setCancelling]   = useState(false);
  const [confirming,   setConfirming]   = useState(false);
  const [showCancel,   setShowCancel]   = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => { fetchAppointment(); }, []);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/api/v1/appointments/${id}`);
      setAppt(res.data);
    } catch {
      toast.error("Error al cargar la cita");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.patch(`/api/v1/appointments/${id}/confirm`);
      toast.success("Cita confirmada");
      fetchAppointment();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al confirmar");
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/api/v1/appointments/${id}/cancel`, {
        cancelled_by:        "staff",
        cancellation_reason: cancelReason,
      });
      toast.success("Cita cancelada");
      setShowCancel(false);
      fetchAppointment();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cancelar");
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-GT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }) + " · " + d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
  };

  const formatTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
        No se pudo cargar la cita.
      </div>
    );
  }

  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
  const canConfirm = appt.status === "pending";
  const canCancel  = !["cancelled", "completed"].includes(appt.status);
  const canRecord  = ["confirmed", "completed"].includes(appt.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
              Cita #{appt.id}
            </h1>
            <p className="text-sm mt-0.5 capitalize" style={{ color: "#64748b" }}>
              {formatDateTime(appt.scheduled_at)}
            </p>
          </div>
        </div>
        <span
          className="text-sm font-medium px-3 py-1.5 rounded-full"
          style={{ color: status.color, backgroundColor: status.bg, border: `1px solid ${status.border}` }}
        >
          {status.label}
        </span>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Doctor */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Doctor</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eff6ff" }}>
              <span className="text-xs font-bold" style={{ color: "#2563eb" }}>
                {appt.doctor?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <Link href={`/dashboard/doctors/${appt.doctor?.id}/calendar`}>
              <p className="text-sm font-medium hover:underline" style={{ color: "#2563eb", cursor: "pointer" }}>
                {appt.doctor?.full_name}
              </p>
            </Link>
          </div>
        </div>

        {/* Paciente */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>{config.patientLabel}</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f0fdf4" }}>
              <span className="text-xs font-bold" style={{ color: "#16a34a" }}>
                {appt.patient?.name?.[0]}
              </span>
            </div>
            <Link href={`/dashboard/patients/${appt.patient?.id}/records`}>
              <p className="text-sm font-medium hover:underline" style={{ color: "#2563eb", cursor: "pointer" }}>
                {appt.patient?.name}
              </p>
            </Link>
          </div>
        </div>

        {/* Responsable */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>{config.ownerLabel}</p>
          <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{appt.owner?.full_name}</p>
          {appt.owner?.phone && (
            <p className="text-xs mt-1" style={{ color: "#64748b" }}>{appt.owner.phone}</p>
          )}
        </div>
      </div>

      {/* Detalles de la cita */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>Detalle de la cita</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "#94a3b8" }}>Tipo</span>
              <span className="text-sm font-medium" style={{ color: "#0f172a" }}>
                {TYPE_LABEL[appt.appointment_type] || appt.appointment_type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "#94a3b8" }}>Hora inicio</span>
              <span className="text-sm font-medium" style={{ color: "#0f172a" }}>{formatTime(appt.scheduled_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "#94a3b8" }}>Hora fin</span>
              <span className="text-sm font-medium" style={{ color: "#0f172a" }}>{formatTime(appt.ends_at)}</span>
            </div>
            {appt.confirmed_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#94a3b8" }}>Confirmada el</span>
                <span className="text-xs font-medium" style={{ color: "#16a34a" }}>
                  {new Date(appt.confirmed_at).toLocaleDateString("es-GT")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>Motivo y notas</p>
          {appt.reason ? (
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#0f172a" }}>{appt.reason}</p>
          ) : (
            <p className="text-xs mb-3" style={{ color: "#cbd5e1" }}>Sin motivo registrado</p>
          )}
          {appt.notes && (
            <>
              <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>Notas</p>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{appt.notes}</p>
            </>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-3">
        {canConfirm && (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            style={{ backgroundColor: "#2563eb", color: "#ffffff", cursor: confirming ? "not-allowed" : "pointer" }}
          >
            {confirming ? "Confirmando..." : "✓ Confirmar cita"}
          </button>
        )}

        {canRecord && (
          <Link href={`/dashboard/medical-records/new?appointment_id=${appt.id}`}>
            <button
              className="text-sm font-medium px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
            >
              + Registrar consulta
            </button>
          </Link>
        )}

        {appt.status === "cancelled" && (
          <Link href={`/dashboard/waitlist`}>
            <button
              className="text-sm font-medium px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
            >
              ⏳ Ver lista de espera
            </button>
          </Link>
        )}

        {canCancel && (
          <button
            onClick={() => setShowCancel(true)}
            className="text-sm font-medium px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
          >
            Cancelar cita
          </button>
        )}
      </div>

      {/* Modal cancelación */}
      {showCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
          onClick={() => setShowCancel(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
            style={{ backgroundColor: "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "#0f172a" }}>Cancelar cita</h2>
              <button
                onClick={() => setShowCancel(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
              >
                ✕
              </button>
            </div>
            <p className="text-sm" style={{ color: "#64748b" }}>
              ¿Estás seguro que deseas cancelar la cita de <strong>{appt.patient?.name}</strong>?
            </p>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>
                Motivo de cancelación (opcional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Paciente no puede asistir..."
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a", resize: "none" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#dc2626", color: "#ffffff", cursor: cancelling ? "not-allowed" : "pointer" }}
              >
                {cancelling ? "Cancelando..." : "Sí, cancelar"}
              </button>
              <button
                onClick={() => setShowCancel(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                Mantener cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
