"use client";

import { useState, useEffect, useCallback } from "react";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";

const PLAN_LABEL = {
  trial:        "Trial",
  basic:        "Básico",
  professional: "Profesional",
  enterprise:   "Empresarial",
};

const PLAN_COLOR = {
  trial:        "#f59e0b",
  basic:        "#3b82f6",
  professional: "#8b5cf6",
  enterprise:   "#06b6d4",
};

function formatPeriod(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parsePeriod(str) {
  const [y, m] = str.split("-").map(Number);
  return { year: y, month: m };
}

function monthName(month, year) {
  return new Date(year, month - 1, 1).toLocaleDateString("es-GT", {
    month: "long",
    year: "numeric",
  });
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-GT", { day: "numeric", month: "short" });
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1"
      style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
    >
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#475569" }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: color || "#f1f5f9" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "#64748b" }}>{sub}</p>}
    </div>
  );
}

function PaymentModal({ org, planPrice, period, onClose, onSaved }) {
  const [amount, setAmount]   = useState(String(planPrice || ""));
  const [notes,  setNotes]    = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await superadminApi.post("/api/superadmin/billing", {
        organization_id: org.id,
        period,
        amount_paid: parseFloat(amount),
        notes: notes.trim() || undefined,
      });
      onSaved(res.data);
      toast.success(`Pago de Q${parseFloat(amount).toFixed(2)} registrado para ${org.name}`);
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? errors[0] : "Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-base font-semibold" style={{ color: "#f1f5f9" }}>
            Registrar pago
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {org.name} — {monthName(parsePeriod(period).month, parsePeriod(period).year)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
              Monto pagado (GTQ)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                color: "#f1f5f9",
              }}
            />
            {planPrice > 0 && (
              <p className="text-xs mt-1" style={{ color: "#475569" }}>
                Precio del plan: Q{planPrice.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej: Pagó vía transferencia, referencia #123"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                color: "#f1f5f9",
              }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: loading ? "#1d4ed8" : "#2563eb",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Guardando..." : "Confirmar pago"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm"
              style={{ backgroundColor: "#0f172a", color: "#64748b", border: "1px solid #334155" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // { org, planPrice }

  const period = formatPeriod(year, month);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superadminApi.get("/api/superadmin/billing", { params: { period } });
      setData(res.data);
    } catch {
      toast.error("Error al cargar la facturación");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const handleUndoPayment = async (billingId, orgName) => {
    try {
      await superadminApi.delete(`/api/superadmin/billing/${billingId}`);
      toast.success(`Pago de ${orgName} eliminado`);
      fetchBilling();
    } catch {
      toast.error("Error al eliminar el pago");
    }
  };

  const handleToggleSuspend = async (org) => {
    const newStatus = org.status === "suspended" ? "active" : "suspended";
    const label     = newStatus === "suspended" ? "suspendida" : "reactivada";
    try {
      await superadminApi.patch(`/api/superadmin/organizations/${org.id}/update_license`, {
        status: newStatus,
      });
      toast.success(`${org.name} ${label}`);
      fetchBilling();
    } catch {
      toast.error("Error al cambiar el estado");
    }
  };

  const handlePaymentSaved = () => {
    fetchBilling();
  };

  const { summary } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            Facturación
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Control manual de pagos por organización
          </p>
        </div>

        {/* Navegador de mes */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            ←
          </button>
          <div
            className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize"
            style={{ backgroundColor: "#1e293b", color: "#f1f5f9", border: "1px solid #334155", minWidth: "160px", textAlign: "center" }}
          >
            {monthName(month, year)}
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
            style={{ backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            →
          </button>
        </div>
      </div>

      {/* Resumen */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", height: "90px" }} />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Esperado"
            value={`Q${summary.total_expected_gtq.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`}
            sub={`${summary.total_orgs} organización${summary.total_orgs !== 1 ? "es" : ""} activas`}
            color="#94a3b8"
          />
          <SummaryCard
            label="Cobrado"
            value={`Q${summary.total_collected_gtq.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`}
            sub={`${summary.paid} pago${summary.paid !== 1 ? "s" : ""} registrado${summary.paid !== 1 ? "s" : ""}`}
            color="#22c55e"
          />
          <SummaryCard
            label="Pendiente"
            value={`Q${(summary.total_expected_gtq - summary.total_collected_gtq).toLocaleString("es-GT", { minimumFractionDigits: 2 })}`}
            sub={`${summary.pending} sin pagar`}
            color={summary.pending > 0 ? "#f59e0b" : "#22c55e"}
          />
          <SummaryCard
            label="Completado"
            value={summary.total_orgs > 0 ? `${Math.round((summary.paid / summary.total_orgs) * 100)}%` : "—"}
            sub={`${summary.paid} / ${summary.total_orgs}`}
            color={summary.pending === 0 && summary.total_orgs > 0 ? "#22c55e" : "#f1f5f9"}
          />
        </div>
      ) : null}

      {/* Tabla */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #334155", backgroundColor: "#0f172a" }}>
              {["Organización", "Plan", "Precio GTQ", "Estado", "Pago " + monthName(month, year), "Acciones"].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#475569" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#334155", width: j === 0 ? "140px" : "80px" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: "#475569" }}>
                  No hay organizaciones de pago registradas
                </td>
              </tr>
            ) : (
              data?.data?.map(({ organization: org, plan_price_gtq, billing_record }) => (
                <tr
                  key={org.id}
                  style={{ borderBottom: "1px solid #334155" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {/* Organización */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
                      {org.name}
                    </p>
                    <p className="text-xs" style={{ color: "#475569" }}>
                      {org.email}
                    </p>
                  </td>

                  {/* Plan */}
                  <td className="px-5 py-4">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: PLAN_COLOR[org.plan] || "#94a3b8",
                        backgroundColor: `${PLAN_COLOR[org.plan]}18` || "#1e293b",
                        border: `1px solid ${PLAN_COLOR[org.plan]}44` || "1px solid #334155",
                      }}
                    >
                      {PLAN_LABEL[org.plan] || org.plan}
                    </span>
                  </td>

                  {/* Precio */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
                      Q{plan_price_gtq.toFixed(2)}
                    </p>
                  </td>

                  {/* Estado cuenta */}
                  <td className="px-5 py-4">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={
                        org.status === "suspended"
                          ? { color: "#ef4444", backgroundColor: "#450a0a33", border: "1px solid #7f1d1d" }
                          : { color: "#22c55e", backgroundColor: "#14532d33", border: "1px solid #166534" }
                      }
                    >
                      {org.status === "suspended" ? "Suspendida" : "Activa"}
                    </span>
                  </td>

                  {/* Estado pago */}
                  <td className="px-5 py-4">
                    {billing_record ? (
                      <div>
                        <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                          ✓ Pagado
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                          Q{parseFloat(billing_record.amount_paid).toFixed(2)} · {formatDate(billing_record.recorded_at)}
                        </p>
                        {billing_record.notes && (
                          <p className="text-xs mt-0.5 italic" style={{ color: "#334155" }}>
                            {billing_record.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium" style={{ color: "#f59e0b" }}>
                        ⏳ Pendiente
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {billing_record ? (
                        <button
                          onClick={() => handleUndoPayment(billing_record.id, org.name)}
                          className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                          style={{ color: "#94a3b8", backgroundColor: "#0f172a", border: "1px solid #334155" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#7f1d1d"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#334155"; }}
                        >
                          Deshacer
                        </button>
                      ) : (
                        <button
                          onClick={() => setModal({ org, planPrice: plan_price_gtq })}
                          className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                          style={{ color: "#ffffff", backgroundColor: "#2563eb", border: "1px solid #2563eb" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
                        >
                          Registrar pago
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleSuspend(org)}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        style={
                          org.status === "suspended"
                            ? { color: "#22c55e", backgroundColor: "#14532d33", border: "1px solid #166534" }
                            : { color: "#ef4444", backgroundColor: "#450a0a33", border: "1px solid #7f1d1d" }
                        }
                      >
                        {org.status === "suspended" ? "Reactivar" : "Suspender"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal registrar pago */}
      {modal && (
        <PaymentModal
          org={modal.org}
          planPrice={modal.planPrice}
          period={period}
          onClose={() => setModal(null)}
          onSaved={handlePaymentSaved}
        />
      )}
    </div>
  );
}
