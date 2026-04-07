"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending:     { label: "Pendiente",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  confirmed:   { label: "Confirmada",  color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  in_progress: { label: "En curso",    color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  completed:   { label: "Completada",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  cancelled:   { label: "Cancelada",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  no_show:     { label: "No asistió",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
};

const TYPE_LABEL = {
  first_visit: "Primera visita",
  follow_up:   "Seguimiento",
  emergency:   "Urgencia",
  routine:     "Rutina",
};

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const { organization } = useAuth();
  const config  = getConfig(organization?.clinic_type);

  const [appt,         setAppt]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [cancelling,        setCancelling]        = useState(false);
  const [confirming,        setConfirming]        = useState(false);
  const [starting,          setStarting]          = useState(false);
  const [markingNoShow,     setMarkingNoShow]     = useState(false);
  const [showNoShow,        setShowNoShow]        = useState(false);
  const [showCancel,        setShowCancel]        = useState(false);
  const [cancelReason,      setCancelReason]      = useState("");
  const [showCancelSeries,  setShowCancelSeries]  = useState(false);
  const [cancelSeriesReason,setCancelSeriesReason]= useState("");
  const [cancellingSerices, setCancellingSerices] = useState(false);

  // Pagos
  const [showComplete,   setShowComplete]   = useState(false);
  const [completing,     setCompleting]     = useState(false);
  const [withPayment,    setWithPayment]    = useState(true);
  const [paymentForm,    setPaymentForm]    = useState({ amount: "", method: "cash", notes: "" });
  const [payments,       setPayments]       = useState([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [addingPayment,  setAddingPayment]  = useState(false);
  const [newPayment,     setNewPayment]     = useState({ amount: "", method: "cash", notes: "" });

  useEffect(() => { fetchAppointment(); }, []);
  useEffect(() => { if (appt) fetchPayments(); }, [appt?.id]);

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

  const fetchPayments = async () => {
    try {
      const res = await api.get(`/api/v1/appointments/${id}/payments`);
      setPayments(res.data);
    } catch {}
  };

  const handleComplete = async () => {
    if (withPayment && !paymentForm.amount) {
      toast.error("Ingresa el monto del pago");
      return;
    }
    setCompleting(true);
    try {
      const body = {};
      if (withPayment) {
        body.payment = { amount: paymentForm.amount, payment_method: paymentForm.method, notes: paymentForm.notes };
      }
      await api.patch(`/api/v1/appointments/${id}/complete`, body);
      toast.success("Cita finalizada");
      setShowComplete(false);
      setPaymentForm({ amount: "", method: "cash", notes: "" });
      setWithPayment(true);
      fetchAppointment();
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || err.response?.data?.error || "Error al finalizar");
    } finally {
      setCompleting(false);
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.amount) { toast.error("Ingresa el monto"); return; }
    setAddingPayment(true);
    try {
      await api.post(`/api/v1/appointments/${id}/payments`, {
        payment: { amount: newPayment.amount, payment_method: newPayment.method, notes: newPayment.notes }
      });
      toast.success("Pago registrado");
      setShowAddPayment(false);
      setNewPayment({ amount: "", method: "cash", notes: "" });
      fetchAppointment();
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al registrar pago");
    } finally {
      setAddingPayment(false);
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

  const handleStart = async () => {
    setStarting(true);
    try {
      await api.patch(`/api/v1/appointments/${id}/start`);
      toast.success("Cita iniciada");
      fetchAppointment();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al iniciar la cita");
    } finally {
      setStarting(false);
    }
  };

  const handleNoShow = async () => {
    setMarkingNoShow(true);
    try {
      await api.patch(`/api/v1/appointments/${id}/no_show`);
      toast.success("Registrada como no presentada");
      setShowNoShow(false);
      fetchAppointment();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al registrar");
    } finally {
      setMarkingNoShow(false);
    }
  };

  const handleCancelSeries = async () => {
    setCancellingSerices(true);
    try {
      await api.patch(`/api/v1/appointments/${id}/cancel_series`, {
        cancellation_reason: cancelSeriesReason || "Serie cancelada",
      });
      toast.success("Serie de citas cancelada");
      setShowCancelSeries(false);
      fetchAppointment();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cancelar la serie");
    } finally {
      setCancellingSerices(false);
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
    const [datePart, timePart] = iso.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-GT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }) + " · " + timePart.slice(0, 5);
  };

  const formatTime = (iso) => {
    if (!iso) return "—";
    return iso.slice(11, 16);
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

  const PAYMENT_METHODS = { cash: "Efectivo", card: "Tarjeta", transfer: "Transferencia", other: "Otro" };
  const surcharge    = appt?.doctor?.card_surcharge_percent || 0;
  const baseFee      = appt?.payment_summary?.consultation_fee || null;
  const calcWithCard = (base) => base ? (base * (1 + surcharge / 100)).toFixed(2) : "";
  const amountForMethod = (method) =>
    method === "card" && surcharge > 0 && baseFee
      ? calcWithCard(baseFee)
      : baseFee ? baseFee.toFixed(2) : "";

  const PAYMENT_STATUS_CONFIG = {
    pagado:      { label: "Pagado",       color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    parcial:     { label: "Pago parcial", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
    sin_pago:    { label: "Sin pago",     color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    sin_tarifa:  { label: "Sin tarifa",   color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
  };

  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
  const canConfirm   = appt.status === "pending";
  const canStart     = appt.status === "confirmed";
  const canComplete  = ["confirmed", "in_progress"].includes(appt.status);
  const canNoShow    = ["pending", "confirmed", "in_progress"].includes(appt.status);
  const canCancel    = !["cancelled", "completed", "no_show"].includes(appt.status);
  const canRecord    = ["confirmed", "in_progress", "completed"].includes(appt.status);
  const paymentSummary = appt.payment_summary || {};
  const paymentStatusCfg = PAYMENT_STATUS_CONFIG[paymentSummary.payment_status] || PAYMENT_STATUS_CONFIG.sin_tarifa;
  const canAddMorePayments = appt.status === "completed" && paymentSummary.payment_status !== "pagado";

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
        <div className="flex items-center gap-2">
          {appt.recurrence_group_id && (
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1"
              style={{ color: "#7c3aed", backgroundColor: "#faf5ff", border: "1px solid #e9d5ff" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
              </svg>
              Sesión {appt.recurrence_index} de {appt.recurrence_total}
            </span>
          )}
          <span
            className="text-sm font-medium px-3 py-1.5 rounded-full"
            style={{ color: status.color, backgroundColor: status.bg, border: `1px solid ${status.border}` }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Doctor */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>{config.staffSingularLabel}</p>
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
          {appt.owner?.id ? (
            <>
              <Link href={`/dashboard/owners/${appt.owner.id}`}>
                <p className="text-sm font-medium hover:underline" style={{ color: "#2563eb", cursor: "pointer" }}>{appt.owner.full_name}</p>
              </Link>
              {appt.owner.phone && (
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>{appt.owner.phone}</p>
              )}
            </>
          ) : (
            <p className="text-sm" style={{ color: "#94a3b8" }}>—</p>
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
        {canCancel && (
          <Link href={`/dashboard/appointments/${id}/edit`}>
            <button
              className="text-sm font-medium px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              Editar cita
            </button>
          </Link>
        )}

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

        {canStart && (
          <button
            onClick={handleStart}
            disabled={starting}
            className="text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            style={{ backgroundColor: "#0891b2", color: "#ffffff", cursor: starting ? "not-allowed" : "pointer" }}
          >
            {starting ? "Iniciando..." : "▶ Iniciar consulta"}
          </button>
        )}

        {canComplete && (
          <button
            onClick={() => { fetchAppointment(); setPaymentForm(f => ({ ...f, amount: amountForMethod(f.method) })); setShowComplete(true); }}
            className="text-sm font-medium px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
          >
            ✓ Finalizar cita
          </button>
        )}

        {canNoShow && (
          <button
            onClick={() => setShowNoShow(true)}
            className="text-sm font-medium px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#faf5ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}
          >
            No asistió
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

        {canCancel && appt.recurrence_group_id && (
          <button
            onClick={() => setShowCancelSeries(true)}
            className="text-sm font-medium px-5 py-2.5 rounded-xl"
            style={{ backgroundColor: "#fdf4ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}
          >
            Cancelar toda la serie
          </button>
        )}
      </div>

      {/* Sección de pagos */}
      {(appt.status === "completed" || payments.length > 0) && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Pagos</p>
              {paymentSummary.payment_status && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: paymentStatusCfg.color, backgroundColor: paymentStatusCfg.bg, border: `1px solid ${paymentStatusCfg.border}` }}>
                  {paymentStatusCfg.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {paymentSummary.consultation_fee && (
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Tarifa: <span style={{ color: "#0f172a", fontWeight: 600 }}>Q{paymentSummary.consultation_fee.toFixed(2)}</span>
                  {" · "}Total recibido: <span style={{ color: "#16a34a", fontWeight: 600 }}>Q{(paymentSummary.total_paid || 0).toFixed(2)}</span>
                </p>
              )}
              {canAddMorePayments && (
                <button onClick={() => { fetchAppointment(); setNewPayment(f => ({ ...f, amount: amountForMethod(f.method) })); setShowAddPayment(true); }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                  + Agregar pago
                </button>
              )}
            </div>
          </div>
          {payments.length === 0 ? (
            <div className="px-6 py-6 text-center" style={{ backgroundColor: "#ffffff" }}>
              <p className="text-sm" style={{ color: "#94a3b8" }}>No hay pagos registrados para esta cita</p>
            </div>
          ) : (
            <table className="w-full" style={{ backgroundColor: "#ffffff" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Monto", "Método", "Registrado por", "Fecha", "Notas"].map(h => (
                    <th key={h} className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: "#16a34a" }}>Q{p.amount.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm" style={{ color: "#0f172a" }}>{PAYMENT_METHODS[p.payment_method] || p.payment_method}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: "#64748b" }}>{p.recorded_by}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: "#64748b" }}>
                        {new Date(p.created_at).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{p.notes || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal finalizar cita */}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(15,23,42,0.5)" }} onClick={() => setShowComplete(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4 space-y-5" style={{ backgroundColor: "#ffffff" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "#0f172a" }}>Finalizar cita</h2>
              <button onClick={() => setShowComplete(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}>✕</button>
            </div>

            {/* Toggle pago */}
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>¿Registrar pago?</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Puedes agregar más pagos después</p>
              </div>
              <button type="button" onClick={() => setWithPayment(v => !v)}
                className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors"
                style={{ backgroundColor: withPayment ? "#16a34a" : "#e2e8f0" }}>
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: withPayment ? "translateX(20px)" : "translateX(0)" }} />
              </button>
            </div>

            {withPayment && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Monto *</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>Q</span>
                    <input type="number" min="0.01" step="0.01" value={paymentForm.amount}
                      onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00" className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                      style={{ paddingLeft: "28px", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                  </div>
                  {appt.payment_summary?.consultation_fee && (
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Tarifa de consulta: Q{appt.payment_summary.consultation_fee.toFixed(2)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Método de pago *</label>
                  <select value={paymentForm.method}
                    onChange={e => {
                      const method = e.target.value;
                      setPaymentForm(f => ({ ...f, method, amount: amountForMethod(method) }));
                    }}
                    className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e2e8f0", color: "#0f172a", backgroundColor: "#ffffff" }}>
                    {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {paymentForm.method === "card" && surcharge > 0 && baseFee && (
                    <div className="mt-2 px-3 py-2 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                      <span className="text-xs" style={{ color: "#2563eb" }}>Q{baseFee.toFixed(2)} + {surcharge}% recargo</span>
                      <span className="text-sm font-bold" style={{ color: "#2563eb" }}>= Q{calcWithCard(baseFee)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Nota (opcional)</label>
                  <input type="text" value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Ej: pago en efectivo exacto"
                    className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e2e8f0", color: "#0f172a" }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleComplete} disabled={completing}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#16a34a", color: "#ffffff", cursor: completing ? "not-allowed" : "pointer" }}>
                {completing ? "Finalizando..." : "Finalizar cita"}
              </button>
              <button onClick={() => setShowComplete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar pago (después de completada) */}
      {showAddPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(15,23,42,0.5)" }} onClick={() => setShowAddPayment(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4 space-y-4" style={{ backgroundColor: "#ffffff" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "#0f172a" }}>Agregar pago</h2>
              <button onClick={() => setShowAddPayment(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}>✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Monto *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>Q</span>
                  <input type="number" min="0.01" step="0.01" value={newPayment.amount}
                    onChange={e => setNewPayment(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00" className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                    style={{ paddingLeft: "28px", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Método de pago *</label>
                <select value={newPayment.method}
                  onChange={e => {
                    const method = e.target.value;
                    setNewPayment(f => ({ ...f, method, amount: amountForMethod(method) }));
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e2e8f0", color: "#0f172a", backgroundColor: "#ffffff" }}>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {newPayment.method === "card" && surcharge > 0 && baseFee && (
                  <div className="mt-2 px-3 py-2 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <span className="text-xs" style={{ color: "#2563eb" }}>Q{baseFee.toFixed(2)} + {surcharge}% recargo</span>
                    <span className="text-sm font-bold" style={{ color: "#2563eb" }}>= Q{calcWithCard(baseFee)}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Nota (opcional)</label>
                <input type="text" value={newPayment.notes} onChange={e => setNewPayment(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej: saldo pendiente"
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={{ border: "1px solid #e2e8f0", color: "#0f172a" }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddPayment} disabled={addingPayment}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#2563eb", color: "#ffffff", cursor: addingPayment ? "not-allowed" : "pointer" }}>
                {addingPayment ? "Guardando..." : "Registrar pago"}
              </button>
              <button onClick={() => setShowAddPayment(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal no asistió */}
      {showNoShow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
          onClick={() => setShowNoShow(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
            style={{ backgroundColor: "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "#0f172a" }}>Registrar como no presentado</h2>
              <button
                onClick={() => setShowNoShow(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
              >
                ✕
              </button>
            </div>
            <p className="text-sm" style={{ color: "#64748b" }}>
              ¿El paciente <strong>{appt.patient?.name}</strong> no se presentó a la cita? Esto registrará el estado como <strong>No asistió</strong> y no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleNoShow}
                disabled={markingNoShow}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#7c3aed", color: "#ffffff", cursor: markingNoShow ? "not-allowed" : "pointer" }}
              >
                {markingNoShow ? "Registrando..." : "Sí, no asistió"}
              </button>
              <button
                onClick={() => setShowNoShow(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelar serie */}
      {showCancelSeries && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
          onClick={() => setShowCancelSeries(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
            style={{ backgroundColor: "#ffffff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "#0f172a" }}>Cancelar toda la serie</h2>
              <button
                onClick={() => setShowCancelSeries(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff", color: "#7c3aed" }}>
              Esto cancelará <strong>todas las citas pendientes o confirmadas</strong> de la serie ({appt.recurrence_total} sesiones en total). Esta acción no se puede deshacer.
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>
                Motivo de cancelación (opcional)
              </label>
              <textarea
                rows={3}
                value={cancelSeriesReason}
                onChange={(e) => setCancelSeriesReason(e.target.value)}
                placeholder="Motivo por el que se cancela la serie..."
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a", resize: "none" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelSeries}
                disabled={cancellingSerices}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#7c3aed", color: "#ffffff", cursor: cancellingSerices ? "not-allowed" : "pointer" }}
              >
                {cancellingSerices ? "Cancelando..." : "Cancelar toda la serie"}
              </button>
              <button
                onClick={() => setShowCancelSeries(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                Mantener
              </button>
            </div>
          </div>
        </div>
      )}

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
