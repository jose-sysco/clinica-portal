"use client";

import { useState, useEffect } from "react";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";
import MonthPicker from "@/app/superadmin/components/MonthPicker";

const planLabel = {
  trial: "Trial", basic: "Starter", professional: "Pro", enterprise: "Enterprise",
};
const planColor = {
  trial: "#f59e0b", basic: "#3b82f6", professional: "#8b5cf6", enterprise: "#06b6d4",
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(str) {
  if (!str) return "";
  const [y, m] = str.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-GT", {
    month: "long", year: "numeric",
  });
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: color || "#f1f5f9" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#475569" }}>{sub}</p>}
    </div>
  );
}

function OrgRow({ org }) {
  return (
    <div className="flex items-center justify-between py-2 px-4"
      style={{ borderBottom: "1px solid #1e293b" }}>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            backgroundColor: `${planColor[org.plan] || "#64748b"}22`,
            color: planColor[org.plan] || "#64748b",
          }}>
          {(org.name || "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{org.name}</p>
          <span className="text-xs" style={{ color: planColor[org.plan] || "#64748b" }}>
            {planLabel[org.plan] || org.plan}
          </span>
          {org.has_custom_price && (
            <span className="ml-2 text-xs" style={{ color: "#f59e0b" }}>precio especial</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>Q{Number(org.price_monthly).toFixed(2)}</p>
        {org.commission > 0 && (
          <p className="text-xs" style={{ color: "#22c55e" }}>comisión: Q{Number(org.commission).toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}

function SalespersonCard({ sp }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors"
        style={{ backgroundColor: "#1e293b" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#243044")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: "#2563eb22", color: "#3b82f6", border: "1px solid #2563eb44" }}>
            {sp.name[0].toUpperCase()}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{sp.name}</p>
            <p className="text-xs" style={{ color: "#475569" }}>
              {sp.organizations_count} {sp.organizations_count === 1 ? "cliente" : "clientes"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0 ml-4">
          <div className="text-right">
            <p className="text-xs" style={{ color: "#475569" }}>MRR atribuido</p>
            <p className="text-sm font-bold" style={{ color: "#94a3b8" }}>Q{Number(sp.attributed_mrr).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "#475569" }}>A pagar</p>
            <p className="text-lg font-bold" style={{ color: "#22c55e" }}>Q{Number(sp.commission_amount).toFixed(2)}</p>
          </div>
          <span className="text-xs" style={{ color: "#475569" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && sp.organizations.length > 0 && (
        <div style={{ backgroundColor: "#0f172a" }}>
          <div className="px-4 py-2 flex justify-between"
            style={{ borderBottom: "1px solid #1e293b", borderTop: "1px solid #1e293b" }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#334155" }}>Cliente</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#334155" }}>Precio / Comisión</span>
          </div>
          {sp.organizations.map((org) => (
            <OrgRow key={org.id} org={org} />
          ))}
        </div>
      )}

      {open && sp.organizations.length === 0 && (
        <div className="px-5 py-4" style={{ backgroundColor: "#0f172a" }}>
          <p className="text-xs" style={{ color: "#334155" }}>Sin clientes activos este período</p>
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [month, setMonth]     = useState(currentMonth());
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (m) => {
    setLoading(true);
    try {
      const r = await superadminApi.get(`/api/superadmin/reports/commissions?month=${m}`);
      setData(r.data);
    } catch {
      toast.error("Error al cargar el reporte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(month); }, [month]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Reporte de comisiones</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {data ? monthLabel(data.period) : "Cargando..."}
          </p>
        </div>

        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="MRR total atribuido"
              value={`Q${Number(data.totals.attributed_mrr).toFixed(2)}`}
              sub={`${data.totals.organizations} clientes activos`}
              color="#3b82f6"
            />
            <SummaryCard
              label="Total comisiones a pagar"
              value={`Q${Number(data.totals.total_commission).toFixed(2)}`}
              sub={`${data.salespersons.filter((s) => s.commission_amount > 0).length} vendedores`}
              color="#22c55e"
            />
            <SummaryCard
              label="Vendedores activos"
              value={data.salespersons.filter((s) => s.active).length}
              sub={`${data.salespersons.filter((s) => s.organizations_count > 0).length} con clientes`}
            />
            <SummaryCard
              label="Sin vendedor asignado"
              value={data.unassigned.organizations_count}
              sub={data.unassigned.organizations_count > 0 ? `Q${Number(data.unassigned.mrr).toFixed(2)} sin atribuir` : "Todo atribuido"}
              color={data.unassigned.organizations_count > 0 ? "#f59e0b" : "#22c55e"}
            />
          </div>

          {/* Vendedores */}
          {data.salespersons.length === 0 ? (
            <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
              <p className="text-sm" style={{ color: "#64748b" }}>Sin vendedores registrados</p>
              <p className="text-xs mt-2" style={{ color: "#475569" }}>
                Agrega vendedores en la sección "Vendedores" para ver comisiones aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
                Por vendedor
              </p>
              {data.salespersons.map((sp) => (
                <SalespersonCard key={sp.id} sp={sp} />
              ))}
            </div>
          )}

          {/* Sin vendedor */}
          {data.unassigned.organizations_count > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f59e0b33" }}>
              <div className="px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: "#f59e0b11", borderBottom: "1px solid #f59e0b22" }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
                  <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>
                    Sin vendedor asignado ({data.unassigned.organizations_count} clientes · Q{Number(data.unassigned.mrr).toFixed(2)} MRR)
                  </p>
                </div>
              </div>
              <div style={{ backgroundColor: "#0f172a" }}>
                {data.unassigned.organizations.map((org) => (
                  <OrgRow key={org.id} org={org} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
