"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { toast } from "sonner";

const PAYMENT_METHODS = {
  cash:     "Efectivo",
  card:     "Tarjeta",
  transfer: "Transferencia",
  other:    "Otro",
};

const METHOD_COLORS = {
  cash:     { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  card:     { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  transfer: { color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
  other:    { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(amount) {
  return `Q${Number(amount || 0).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentsPage() {
  const { organization } = useAuth();
  const [payments,      setPayments]      = useState([]);
  const [totals,        setTotals]        = useState({});
  const [pagination,    setPagination]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [page,          setPage]          = useState(1);
  const [doctors,       setDoctors]       = useState([]);
  const [loadingExport, setLoadingExport] = useState(false);

  const today     = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    from:           firstOfMonth,
    to:             today,
    payment_method: "",
    doctor_id:      "",
  });

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => { fetchPayments(); }, [page, filters]);
  useEffect(() => { fetchDoctors(); }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (filters.from)           params.from           = filters.from;
      if (filters.to)             params.to             = filters.to;
      if (filters.payment_method) params.payment_method = filters.payment_method;
      if (filters.doctor_id)      params.doctor_id      = filters.doctor_id;

      const r = await api.get("/api/v1/payments", { params });
      setPayments(r.data.data);
      setTotals(r.data.totals);
      setPagination(r.data.pagination);
    } catch {
      toast.error("Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const r = await api.get("/api/v1/doctors", { params: { per_page: 100 } });
      setDoctors(r.data.data || []);
    } catch {}
  };

  const handleExportPDF = async () => {
    setLoadingExport(true);
    try {
      const params = { page: 1, per_page: 2000 };
      if (filters.from)           params.from           = filters.from;
      if (filters.to)             params.to             = filters.to;
      if (filters.payment_method) params.payment_method = filters.payment_method;
      if (filters.doctor_id)      params.doctor_id      = filters.doctor_id;

      const [r, logoBase64] = await Promise.all([
        api.get("/api/v1/payments", { params }),
        organization?.logo_url ? fetchLogoAsBase64(organization.logo_url) : Promise.resolve(null),
      ]);

      const { downloadPaymentsPDF } = await import("@/components/PaymentsPDF");
      await downloadPaymentsPDF({
        payments:     r.data.data,
        totals:       r.data.totals,
        filters,
        organization,
        logoBase64,
      });
    } catch {
      toast.error("Error al exportar PDF");
    } finally {
      setLoadingExport(false);
    }
  };

  const fetchLogoAsBase64 = async (url) => {
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const totalCards = [
    { label: "Total",          value: totals.total,    color: "#0f172a", bg: "#f8fafc" },
    { label: "Efectivo",       value: totals.cash,     color: "#16a34a", bg: "#f0fdf4" },
    { label: "Tarjeta",        value: totals.card,     color: "#2563eb", bg: "#eff6ff" },
    { label: "Transferencia",  value: totals.transfer, color: "#7c3aed", bg: "#faf5ff" },
    { label: "Otro",           value: totals.other,    color: "#64748b", bg: "#f8fafc" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Pagos</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Registro de cobros por consultas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={loadingExport || loading}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
            style={{
              backgroundColor: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0",
              cursor: loadingExport || loading ? "not-allowed" : "pointer",
              opacity: loadingExport || loading ? 0.6 : 1,
            }}
          >
            {loadingExport ? (
              <><span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block" />Generando PDF...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Exportar PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {totalCards.map(c => (
          <div key={c.label} className="rounded-xl p-4" style={{ backgroundColor: c.bg, border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "#94a3b8" }}>{c.label}</p>
            <p className="text-lg font-bold" style={{ color: c.color }}>{formatCurrency(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="rounded-xl p-4 flex flex-wrap gap-3" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "#94a3b8" }}>Desde</label>
          <input type="date" value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="text-sm px-3 py-2 rounded-lg outline-none"
            style={{ border: "1px solid #e2e8f0", color: "#0f172a" }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "#94a3b8" }}>Hasta</label>
          <input type="date" value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="text-sm px-3 py-2 rounded-lg outline-none"
            style={{ border: "1px solid #e2e8f0", color: "#0f172a" }} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "#94a3b8" }}>Método</label>
          <select value={filters.payment_method}
            onChange={e => setFilters(f => ({ ...f, payment_method: e.target.value }))}
            className="text-sm px-3 py-2 rounded-lg outline-none"
            style={{ border: "1px solid #e2e8f0", color: "#0f172a", backgroundColor: "#ffffff" }}>
            <option value="">Todos</option>
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {doctors.length > 1 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#94a3b8" }}>Doctor</label>
            <select value={filters.doctor_id}
              onChange={e => setFilters(f => ({ ...f, doctor_id: e.target.value }))}
              className="text-sm px-3 py-2 rounded-lg outline-none"
              style={{ border: "1px solid #e2e8f0", color: "#0f172a", backgroundColor: "#ffffff" }}>
              <option value="">Todos</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </div>
        )}
        {(filters.payment_method || filters.doctor_id) && (
          <div className="flex items-end">
            <button onClick={() => setFilters(f => ({ ...f, payment_method: "", doctor_id: "" }))}
              className="text-sm px-3 py-2 rounded-lg"
              style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-sm" style={{ color: "#64748b" }}>No hay pagos registrados para el período seleccionado</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          <table className="w-full" style={{ backgroundColor: "#ffffff" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Monto", "Método", "Paciente", "Doctor", "Cita", "Registrado", "Nota"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const mc = METHOD_COLORS[p.payment_method] || METHOD_COLORS.other;
                return (
                  <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? "1px solid #f1f5f9" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold" style={{ color: "#16a34a" }}>{formatCurrency(p.amount)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: mc.color, backgroundColor: mc.bg, border: `1px solid ${mc.border}` }}>
                        {PAYMENT_METHODS[p.payment_method]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm" style={{ color: "#0f172a" }}>{p.patient_name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: "#64748b" }}>{p.doctor_name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/appointments/${p.appointment_id}`}>
                        <span className="text-xs font-medium hover:underline" style={{ color: "#2563eb", cursor: "pointer" }}>
                          #{p.appointment_id} · {formatDate(p.scheduled_at)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: "#64748b" }}>{formatDate(p.created_at)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{p.notes || "—"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Página {pagination.page} de {pagination.pages} — {pagination.count} pagos
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={pagination.page === 1}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ border: "1px solid #e2e8f0", color: pagination.page === 1 ? "#cbd5e1" : "#64748b", cursor: pagination.page === 1 ? "not-allowed" : "pointer" }}>
                  ← Anterior
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={pagination.page === pagination.pages}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ border: "1px solid #e2e8f0", color: pagination.page === pagination.pages ? "#cbd5e1" : "#64748b", cursor: pagination.page === pagination.pages ? "not-allowed" : "pointer" }}>
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
