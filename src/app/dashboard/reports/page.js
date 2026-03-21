"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useFeatures } from "@/lib/useFeature";
import { useAuth } from "@/lib/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import ExportCSVButton from "@/components/ExportCSVButton";
import { APPOINTMENTS_CSV, prepareAppointments } from "@/lib/exportCSV";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Constantes ──────────────────────────────────────────────────────────────

const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const STATUS_COLORS = {
  completed:   "#22c55e",
  confirmed:   "#3b82f6",
  in_progress: "#06b6d4",
  pending:     "#f59e0b",
  cancelled:   "#ef4444",
  no_show:     "#8b5cf6",
};

const STATUS_LABEL = {
  completed:   "Completadas",
  confirmed:   "Confirmadas",
  in_progress: "En curso",
  pending:     "Pendientes",
  cancelled:   "Canceladas",
  no_show:     "No se presentó",
};

const TYPE_LABEL = {
  first_visit: "Primera visita",
  follow_up:   "Seguimiento",
  emergency:   "Urgencia",
  routine:     "Rutina",
};

const TYPE_COLORS = ["#3b82f6","#8b5cf6","#f59e0b","#22c55e","#ef4444","#06b6d4"];
const DOCTOR_COLORS = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#f97316"];

const PERIODS = [
  { key: "week",       label: "Esta semana" },
  { key: "month",      label: "Este mes" },
  { key: "last_month", label: "Mes anterior" },
  { key: "quarter",    label: "Últimos 3 meses" },
  { key: "year",       label: "Este año" },
  { key: "custom",     label: "Personalizado" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function getRange(period, customStart, customEnd) {
  const today = new Date();
  switch (period) {
    case "week": {
      const day   = today.getDay();
      const diff  = today.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(today);
      start.setDate(diff);
      return { start: toISO(start), end: toISO(today) };
    }
    case "month":
      return { start: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), end: toISO(today) };
    case "last_month": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last  = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toISO(first), end: toISO(last) };
    }
    case "quarter": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      return { start: toISO(d), end: toISO(today) };
    }
    case "year":
      return { start: `${today.getFullYear()}-01-01`, end: toISO(today) };
    case "custom":
      return { start: customStart, end: customEnd };
    default:
      return { start: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), end: toISO(today) };
  }
}

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${monthNames[parseInt(m) - 1]} ${y}`;
}

function delta(curr, prev) {
  if (!prev || prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, prev, prevLabel }) {
  const d = prev != null ? delta(parseFloat(value), prev) : null;
  return (
    <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "20px 22px" }}>
      <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: "10px" }}>{label}</p>
      <p style={{ fontSize: "36px", fontWeight: "800", color: color || "#f1f5f9", lineHeight: 1, marginBottom: "6px" }}>{value}</p>
      {sub && <p style={{ fontSize: "12px", color: "#475569", marginBottom: d != null ? "8px" : 0 }}>{sub}</p>}
      {d != null && (
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: d >= 0 ? "#22c55e" : "#ef4444" }}>
            {d >= 0 ? "▲" : "▼"} {Math.abs(d)}%
          </span>
          <span style={{ fontSize: "11px", color: "#334155" }}>{prevLabel || `vs período anterior (${prev})`}</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: "3px" }}>{eyebrow}</p>
      <p style={{ fontSize: "17px", fontWeight: "700", color: "#f1f5f9", margin: 0 }}>{title}</p>
    </div>
  );
}

const darkTooltip = {
  contentStyle: { backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" },
  cursor: { stroke: "#334155" },
};

function Card({ children, style }) {
  return (
    <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "14px", padding: "24px", ...style }}>
      {children}
    </div>
  );
}

// ── Funnel personalizado ─────────────────────────────────────────────────────

function Funnel({ data }) {
  const max = data[0]?.count || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {data.map((stage, i) => {
        const width = Math.max((stage.count / max) * 100, 8);
        const convRate = i > 0 ? stage.pct : null;
        const color = ["#3b82f6", "#8b5cf6", "#22c55e"][i];
        return (
          <div key={stage.stage}>
            {i > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingLeft: "16px", margin: "6px 0" }}>
                <div style={{ width: "1px", height: "20px", backgroundColor: "#334155" }} />
                <span style={{ fontSize: "11px", color: "#475569" }}>
                  Conversión: <strong style={{ color: "#94a3b8" }}>{convRate}%</strong>
                </span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>{stage.stage}</span>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "#f1f5f9" }}>{stage.count.toLocaleString()}</span>
                </div>
                <div style={{ height: "10px", backgroundColor: "#0f172a", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${width}%`,
                    backgroundColor: color,
                    borderRadius: "5px",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user }       = useAuth();
  const features       = useFeatures();
  const featuresLoaded = features.length > 0;
  const isLocked       = featuresLoaded && !features.includes("reports");

  const [activeTab,    setActiveTab]    = useState("summary");
  const [period,       setPeriod]       = useState("month");
  const [customStart,  setCustomStart]  = useState("");
  const [customEnd,    setCustomEnd]    = useState("");
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchData = useCallback(() => {
    const range = getRange(period, customStart, customEnd);
    if (!range.start || !range.end) return;
    setLoading(true);
    setError(null);
    api.get("/api/v1/dashboard/reports", { params: { start_date: range.start, end_date: range.end } })
      .then((r) => setData(r.data))
      .catch(() => setError("No se pudieron cargar los reportes"))
      .finally(() => setLoading(false));
  }, [period, customStart, customEnd]);

  useEffect(() => {
    if (isLocked) { setLoading(false); return; }
    if (period === "custom" && (!customStart || !customEnd)) return;
    fetchData();
  }, [isLocked, period, customStart, customEnd]);

  if (user && user.role === "receptionist") return <AccessDenied />;

  // ── Locked ────────────────────────────────────────────────────────────────
  if (isLocked) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center", gap: "16px" }}>
        <div style={{ fontSize: "48px" }}>🔒</div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f1f5f9", margin: 0 }}>Función no disponible en tu plan</h2>
        <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "360px", margin: 0 }}>
          Los reportes avanzados están disponibles en los planes Profesional y Empresarial.
        </p>
        <a href="mailto:soporte@clinicaportal.com?subject=Actualizar plan"
          style={{ display: "inline-block", padding: "10px 24px", borderRadius: "10px", backgroundColor: "#2563eb", color: "#fff", fontSize: "14px", fontWeight: "600", textDecoration: "none" }}>
          Contactar soporte →
        </a>
      </div>
    );
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  const range   = getRange(period, customStart, customEnd);
  const rangeLabel = (range.start && range.end) ? `${fmtDate(range.start)} — ${fmtDate(range.end)}` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Title + period selector */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: "3px" }}>Análisis avanzado</p>
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>Reportes</h1>
            {rangeLabel && <p style={{ fontSize: "12px", color: "#334155", marginTop: "4px" }}>{rangeLabel}</p>}
          </div>
        </div>

        {/* Period pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                border: period === p.key ? "1px solid #3b82f6" : "1px solid #334155",
                backgroundColor: period === p.key ? "#1d4ed8" : "#1e293b",
                color: period === p.key ? "#ffffff" : "#64748b",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
          {period === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "4px" }}>
              <input
                type="date" value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9", outline: "none" }}
              />
              <span style={{ color: "#334155", fontSize: "12px" }}>→</span>
              <input
                type="date" value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ fontSize: "12px", padding: "5px 10px", borderRadius: "8px", backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9", outline: "none" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #1e293b" }}>
        {[
          { key: "summary",     label: "Resumen" },
          { key: "doctors",     label: "Profesionales" },
          { key: "breakdown",   label: "Análisis" },
          { key: "export",      label: "Exportar" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 18px", fontSize: "13px", fontWeight: "600",
              backgroundColor: "transparent", border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === tab.key ? "#3b82f6" : "#475569",
              cursor: "pointer", transition: "all 0.15s", marginBottom: "-1px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "280px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p style={{ fontSize: "13px", color: "#475569" }}>Cargando reportes...</p>
          </div>
        </div>
      )}

      {!loading && error && (
        <p style={{ color: "#ef4444", fontSize: "14px" }}>{error}</p>
      )}

      {!loading && !error && data && (
        <>
          {/* ── TAB: RESUMEN ──────────────────────────────────────────────── */}
          {activeTab === "summary" && <SummaryTab data={data} />}

          {/* ── TAB: PROFESIONALES ────────────────────────────────────────── */}
          {activeTab === "doctors" && <DoctorsTab data={data} />}

          {/* ── TAB: ANÁLISIS ─────────────────────────────────────────────── */}
          {activeTab === "breakdown" && <BreakdownTab data={data} />}

          {/* ── TAB: EXPORTAR ─────────────────────────────────────────────── */}
          {activeTab === "export" && <ExportTab />}
        </>
      )}
    </div>
  );
}

// ── TAB: Resumen ─────────────────────────────────────────────────────────────

function SummaryTab({ data }) {
  const { summary: s, funnel, appointments_by_period } = data;

  const trendData = appointments_by_period.map(({ label, total }) => {
    // Si el label es YYYY-MM, convertirlo a "Ene 25"
    if (/^\d{4}-\d{2}$/.test(label)) {
      const [y, m] = label.split("-");
      return { label: `${monthNames[parseInt(m) - 1]} ${y.slice(2)}`, total };
    }
    // Si es YYYY-MM-DD, convertir a "1 Ene"
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      const [, m, d] = label.split("-");
      return { label: `${parseInt(d)} ${monthNames[parseInt(m) - 1]}`, total };
    }
    return { label, total };
  });

  const completionDelta  = delta(s.completion_rate,  s.prev_completion_rate);
  const cancellationDelta = delta(s.cancellation_rate, s.prev_cancellation_rate);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <KpiCard
          label="Total citas"
          value={s.total.toLocaleString()}
          sub={`Período anterior: ${s.prev_total}`}
          color="#f1f5f9"
          prev={s.prev_total}
          prevLabel={`vs período anterior (${s.prev_total})`}
        />
        <KpiCard
          label="Tasa completadas"
          value={`${s.completion_rate}%`}
          sub={`${s.completed} completadas de ${s.total}`}
          color={s.completion_rate >= 80 ? "#22c55e" : s.completion_rate >= 60 ? "#f59e0b" : "#ef4444"}
          prev={s.prev_completion_rate}
          prevLabel={`vs período anterior (${s.prev_completion_rate}%)`}
        />
        <KpiCard
          label="Tasa cancelación"
          value={`${s.cancellation_rate}%`}
          sub={`${s.cancelled} citas canceladas`}
          color={s.cancellation_rate <= 10 ? "#22c55e" : s.cancellation_rate <= 20 ? "#f59e0b" : "#ef4444"}
          prev={s.prev_cancellation_rate}
          prevLabel={`vs período anterior (${s.prev_cancellation_rate}%)`}
        />
        <KpiCard
          label="No se presentó"
          value={`${s.no_show_rate}%`}
          sub={`${s.no_show} ausencias`}
          color={s.no_show_rate <= 5 ? "#22c55e" : s.no_show_rate <= 15 ? "#f59e0b" : "#ef4444"}
        />
      </div>

      {/* Tendencia + Funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        <Card>
          <SectionHeader eyebrow="Tendencia" title="Citas por período" />
          {trendData.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#475569" }}>Sin datos en este período</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip {...darkTooltip} formatter={(v) => [v, "Citas"]} />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#grad)" dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionHeader eyebrow="Conversión" title="Funnel de citas" />
          <Funnel data={funnel} />
        </Card>
      </div>

      {/* Estado breakdown */}
      <Card>
        <SectionHeader eyebrow="Distribución" title="Estado de citas en el período" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {[
            { key: "completed",   label: "Completadas",   value: s.completed },
            { key: "confirmed",   label: "Confirmadas",   value: s.confirmed },
            { key: "pending",     label: "Pendientes",    value: s.pending },
            { key: "cancelled",   label: "Canceladas",    value: s.cancelled },
            { key: "no_show",     label: "No presentados",value: s.no_show },
            { key: "in_progress", label: "En curso",      value: s.in_progress },
          ].map(({ key, label, value }) => {
            const pct = s.total > 0 ? Math.round((value / s.total) * 100) : 0;
            const color = STATUS_COLORS[key];
            return (
              <div key={key} style={{ backgroundColor: "#0f172a", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color, backgroundColor: color + "18", padding: "2px 8px", borderRadius: "20px" }}>
                    {pct}%
                  </span>
                </div>
                <p style={{ fontSize: "26px", fontWeight: "800", color: "#f1f5f9", margin: 0, lineHeight: 1 }}>{value}</p>
                <div style={{ marginTop: "8px", height: "3px", backgroundColor: "#1e293b", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: "2px" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ── TAB: Profesionales ───────────────────────────────────────────────────────

function DoctorsTab({ data }) {
  const { busiest_doctors: doctors } = data;
  const maxTotal = doctors[0]?.total || 1;

  if (doctors.length === 0) {
    return (
      <Card>
        <p style={{ fontSize: "14px", color: "#475569", textAlign: "center", padding: "40px 0" }}>
          Sin datos de profesionales en este período
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionHeader eyebrow="Rendimiento" title="Ranking de profesionales en el período" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Profesional", "Citas", "Completadas", "Tasa", "Distribución"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569", borderBottom: "1px solid #334155" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc, i) => {
                const color = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
                const barW  = Math.round((doc.total / maxTotal) * 100);
                return (
                  <tr key={doc.doctor_id} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: "800", color }}>{i + 1}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#f1f5f9" }}>{doc.name}</span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#f1f5f9" }}>{doc.total}</span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ fontSize: "14px", color: "#94a3b8" }}>{doc.completed}</span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{
                        fontSize: "12px", fontWeight: "700",
                        color: doc.completion_rate >= 80 ? "#22c55e" : doc.completion_rate >= 60 ? "#f59e0b" : "#ef4444",
                        backgroundColor: (doc.completion_rate >= 80 ? "#22c55e" : doc.completion_rate >= 60 ? "#f59e0b" : "#ef4444") + "18",
                        padding: "3px 10px", borderRadius: "20px",
                      }}>
                        {doc.completion_rate}%
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px", width: "160px" }}>
                      <div style={{ height: "6px", backgroundColor: "#0f172a", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barW}%`, backgroundColor: color, borderRadius: "3px" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── TAB: Análisis ─────────────────────────────────────────────────────────────

function BreakdownTab({ data }) {
  const { by_day_of_week, by_type, summary: s } = data;

  // Reordenar Dom al final (Lun→Dom)
  const weekData = [...by_day_of_week.slice(1), by_day_of_week[0]];
  const maxDay = Math.max(...weekData.map((d) => d.count), 1);

  const totalTypes = by_type.reduce((acc, r) => acc + r.count, 0);

  const pieData = by_type.map((r) => ({
    name:  TYPE_LABEL[r.type] || r.type,
    value: r.count,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Día de semana */}
      <Card>
        <SectionHeader eyebrow="Patrones" title="Citas por día de semana" />
        {weekData.every((d) => d.count === 0) ? (
          <p style={{ fontSize: "13px", color: "#475569" }}>Sin datos en este período</p>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "160px" }}>
            {weekData.map((d, i) => {
              const h = Math.max((d.count / maxDay) * 120, d.count > 0 ? 8 : 2);
              const isMax = d.count === maxDay && d.count > 0;
              return (
                <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  {d.count > 0 && (
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isMax ? "#3b82f6" : "#475569" }}>{d.count}</span>
                  )}
                  <div style={{ width: "100%", height: `${h}px`, backgroundColor: isMax ? "#3b82f6" : "#334155", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease" }} />
                  <span style={{ fontSize: "11px", color: isMax ? "#3b82f6" : "#475569", fontWeight: isMax ? "700" : "500" }}>{d.day}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Tipo de cita */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Card>
          <SectionHeader eyebrow="Tipos" title="Distribución por tipo de cita" />
          {pieData.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#475569" }}>Sin datos</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                    {pieData.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                {by_type.map((r, i) => {
                  const pct = totalTypes > 0 ? Math.round((r.count / totalTypes) * 100) : 0;
                  const color = TYPE_COLORS[i % TYPE_COLORS.length];
                  return (
                    <div key={r.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>{TYPE_LABEL[r.type] || r.type}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#f1f5f9" }}>{r.count}</span>
                        <span style={{ fontSize: "11px", fontWeight: "600", color, backgroundColor: color + "18", padding: "1px 7px", borderRadius: "20px", minWidth: "36px", textAlign: "center" }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Resumen de tasas */}
        <Card>
          <SectionHeader eyebrow="Métricas clave" title="Tasas del período" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { label: "Tasa de completadas", value: s.completion_rate, good: true },
              { label: "Tasa de cancelación", value: s.cancellation_rate, good: false },
              { label: "Tasa de ausencia",    value: s.no_show_rate,    good: false },
            ].map(({ label, value, good }) => {
              const isGood  = good ? value >= 80 : value <= 10;
              const isMid   = good ? value >= 60 : value <= 20;
              const color   = isGood ? "#22c55e" : isMid ? "#f59e0b" : "#ef4444";
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>{label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "800", color }}>{value}%</span>
                  </div>
                  <div style={{ height: "6px", backgroundColor: "#0f172a", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, backgroundColor: color, borderRadius: "3px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── TAB: Exportar ─────────────────────────────────────────────────────────────

function ExportTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card>
        <SectionHeader eyebrow="Exportación" title="Descarga de datos" />
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
          Exporta los datos completos en formato CSV para análisis externo o reportes contables.
          Los archivos incluyen todos los registros, sin límite de paginación.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              title: "Reporte de citas",
              description: "Todas las citas con doctor, paciente, tipo, estado y fecha",
              component: (
                <ExportCSVButton
                  filename="reporte_citas"
                  endpoint="/api/v1/appointments"
                  headers={APPOINTMENTS_CSV.headers}
                  keys={APPOINTMENTS_CSV.keys}
                  prepare={prepareAppointments}
                />
              ),
            },
            {
              title: "Reporte de pacientes",
              description: "Listado completo de pacientes con responsable y estado",
              component: (
                <ExportCSVButton
                  filename="reporte_pacientes"
                  endpoint="/api/v1/patients"
                  headers={["ID", "Nombre", "Tipo", "Género", "Responsable", "Estado"]}
                  keys={["id", "name", "patient_type", "gender", "owner.full_name", "status"]}
                  prepare={(rows) => rows.map((r) => ({ ...r, status: r.status === "active" ? "Activo" : "Inactivo" }))}
                />
              ),
            },
          ].map(({ title, description, component }) => (
            <div key={title} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", borderRadius: "10px", padding: "16px 18px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#f1f5f9", margin: 0 }}>{title}</p>
                <p style={{ fontSize: "12px", color: "#475569", margin: "3px 0 0" }}>{description}</p>
              </div>
              {component}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
