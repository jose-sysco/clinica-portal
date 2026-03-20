"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useFeatures } from "@/lib/useFeature";
import ExportCSVButton from "@/components/ExportCSVButton";
import { APPOINTMENTS_CSV, prepareAppointments } from "@/lib/exportCSV";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const STATUS_COLORS = { completed: "#22c55e", confirmed: "#3b82f6", pending: "#f59e0b", cancelled: "#ef4444" };
const DOCTOR_COLORS = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"];

function MetricCard({ label, value, sub, color, trend }) {
  return (
    <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "20px" }}>
      <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: "10px" }}>{label}</p>
      <p style={{ fontSize: "34px", fontWeight: "800", color: color || "#f1f5f9", lineHeight: 1, marginBottom: "6px" }}>{value}</p>
      {sub && <p style={{ fontSize: "12px", color: "#475569" }}>{sub}</p>}
      {trend != null && (
        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: trend >= 0 ? "#22c55e" : "#ef4444" }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
          <span style={{ fontSize: "11px", color: "#475569" }}>vs mes anterior</span>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: "4px" }}>{eyebrow}</p>
      <p style={{ fontSize: "17px", fontWeight: "700", color: "#f1f5f9", margin: 0 }}>{title}</p>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" },
  cursor: { stroke: "#334155", strokeWidth: 1 },
};

export default function ReportsPage() {
  const features       = useFeatures();
  const featuresLoaded = features.length > 0;
  const isLocked       = featuresLoaded && !features.includes("reports");

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (isLocked) { setLoading(false); return; }
    api.get("/api/v1/dashboard/reports")
      .then((res) => setData(res.data))
      .catch(() => setError("No se pudieron cargar los reportes"))
      .finally(() => setLoading(false));
  }, [isLocked]);

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

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontSize: "13px", color: "#475569" }}>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (error) return <p style={{ color: "#ef4444", padding: "24px", fontSize: "14px" }}>{error}</p>;
  if (!data) return null;

  const cs      = data.cancellation_stats;
  const monthly = data.appointments_by_month;
  const doctors = data.busiest_doctors;

  // ── Métricas derivadas ──────────────────────────────────────────────────
  const completionRate = cs.total > 0 ? Math.round((cs.completed / cs.total) * 100) : 0;

  const monthlyData = monthly.map(({ month, total }) => {
    const [year, m] = month.split("-");
    return { label: `${monthNames[parseInt(m) - 1]} ${year.slice(2)}`, total };
  });

  // Crecimiento mes a mes
  let momGrowth = null;
  if (monthlyData.length >= 2) {
    const last = monthlyData[monthlyData.length - 1].total;
    const prev = monthlyData[monthlyData.length - 2].total;
    momGrowth = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;
  }

  const peakMonth = monthlyData.reduce((a, b) => (a.total > b.total ? a : b), { label: "—", total: 0 });

  const totalDocAppts = doctors.reduce((s, d) => s + d.total, 0);
  const doctorsWithShare = doctors.map((d) => ({
    ...d,
    share: totalDocAppts > 0 ? Math.round((d.total / totalDocAppts) * 100) : 0,
  }));

  const pieData = [
    { name: "Completadas", value: cs.completed, key: "completed" },
    { name: "Confirmadas", value: cs.confirmed, key: "confirmed" },
    { name: "Pendientes",  value: cs.pending,   key: "pending"   },
    { name: "Canceladas",  value: cs.cancelled,  key: "cancelled" },
  ].filter((d) => d.value > 0);

  // ── Insights automáticos ────────────────────────────────────────────────
  const insights = [];
  if (peakMonth.total > 0)
    insights.push({ icon: "📈", text: `Tu mes más activo fue ${peakMonth.label} con ${peakMonth.total} citas` });
  if (completionRate >= 80)
    insights.push({ icon: "✅", text: `Excelente tasa de completadas: ${completionRate}% de las citas fueron atendidas` });
  else if (completionRate > 0)
    insights.push({ icon: "⚠️", text: `Tasa de completadas: ${completionRate}% — hay margen de mejora` });
  if (cs.cancellation_rate > 20)
    insights.push({ icon: "🔴", text: `La tasa de cancelación (${cs.cancellation_rate}%) es alta — revisá las causas frecuentes` });
  if (doctors[0])
    insights.push({ icon: "🏆", text: `${doctors[0].name} fue el profesional más activo con ${doctors[0].total} citas (${doctorsWithShare[0].share}% del total)` });
  if (momGrowth != null && momGrowth > 0)
    insights.push({ icon: "📊", text: `Crecimiento mensual: +${momGrowth}% respecto al mes anterior` });
  else if (momGrowth != null && momGrowth < 0)
    insights.push({ icon: "📉", text: `Bajaste ${Math.abs(momGrowth)}% en citas comparado al mes anterior` });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: "4px" }}>
            Análisis avanzado
          </p>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>
            Reportes
          </h1>
          <p style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
            Datos históricos desde el inicio · Todos los períodos
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ExportCSVButton
            filename="reporte_citas"
            endpoint="/api/v1/appointments"
            headers={APPOINTMENTS_CSV.headers}
            keys={APPOINTMENTS_CSV.keys}
            prepare={prepareAppointments}
          />
          <ExportCSVButton
            filename="reporte_pacientes"
            endpoint="/api/v1/patients"
            headers={["ID", "Nombre", "Tipo", "Género", "Responsable", "Estado"]}
            keys={["id", "name", "patient_type", "gender", "owner.full_name", "status"]}
            prepare={(rows) => rows.map((r) => ({ ...r, status: r.status === "active" ? "Activo" : "Inactivo" }))}
          />
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <MetricCard
          label="Total citas"
          value={cs.total.toLocaleString()}
          sub="Desde el inicio"
          color="#f1f5f9"
        />
        <MetricCard
          label="Tasa de completadas"
          value={`${completionRate}%`}
          sub={`${cs.completed} de ${cs.total} citas`}
          color={completionRate >= 80 ? "#22c55e" : completionRate >= 60 ? "#f59e0b" : "#ef4444"}
          trend={momGrowth}
        />
        <MetricCard
          label="Tasa de cancelación"
          value={`${cs.cancellation_rate}%`}
          sub={`${cs.cancelled} citas canceladas`}
          color={cs.cancellation_rate > 20 ? "#ef4444" : cs.cancellation_rate > 10 ? "#f59e0b" : "#22c55e"}
        />
        <MetricCard
          label="Mes más activo"
          value={peakMonth.label}
          sub={`${peakMonth.total} citas`}
          color="#3b82f6"
        />
      </div>

      {/* ── Insights automáticos ───────────────────────────────────────── */}
      {insights.length > 0 && (
        <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "20px 24px" }}>
          <p style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: "14px" }}>
            Insights del período
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", backgroundColor: "#0f172a", borderRadius: "8px", padding: "12px 14px" }}>
                <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tendencia mensual ──────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "24px" }}>
        <SectionLabel eyebrow="Tendencia" title="Citas por mes — últimos 12 meses" />
        {monthlyData.length === 0 ? (
          <p style={{ color: "#475569", fontSize: "14px" }}>Sin datos suficientes aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v) => [v, "Citas"]} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#areaBlue)"
                dot={{ fill: "#3b82f6", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Doctores + Estado ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Rendimiento por profesional */}
        <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "24px" }}>
          <SectionLabel eyebrow="Rendimiento" title="Profesionales más activos" />
          {doctorsWithShare.length === 0 ? (
            <p style={{ color: "#475569", fontSize: "14px" }}>Sin datos disponibles</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {doctorsWithShare.map((doc, i) => (
                <div key={doc.doctor_id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
                        backgroundColor: DOCTOR_COLORS[i % DOCTOR_COLORS.length] + "22",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: "10px", fontWeight: "800", color: DOCTOR_COLORS[i % DOCTOR_COLORS.length] }}>
                          {i + 1}
                        </span>
                      </div>
                      <span style={{ fontSize: "13px", color: "#94a3b8" }}>{doc.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "800", color: "#f1f5f9" }}>{doc.total}</span>
                      <span style={{ fontSize: "11px", color: "#475569", minWidth: "30px", textAlign: "right" }}>{doc.share}%</span>
                    </div>
                  </div>
                  <div style={{ height: "5px", backgroundColor: "#0f172a", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${doc.share}%`,
                      backgroundColor: DOCTOR_COLORS[i % DOCTOR_COLORS.length],
                      borderRadius: "3px",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribución por estado */}
        <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "24px" }}>
          <SectionLabel eyebrow="Distribución" title="Estado de citas (total)" />
          {pieData.length === 0 ? (
            <p style={{ color: "#475569", fontSize: "14px" }}>Sin datos</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    dataKey="value"
                    paddingAngle={3}
                    startAngle={90} endAngle={-270}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", fontSize: "12px", color: "#f1f5f9" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                {pieData.map((entry) => {
                  const pct = cs.total > 0 ? Math.round((entry.value / cs.total) * 100) : 0;
                  return (
                    <div key={entry.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATUS_COLORS[entry.key] }} />
                        <span style={{ fontSize: "13px", color: "#94a3b8" }}>{entry.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9" }}>{entry.value}</span>
                        <span style={{
                          fontSize: "11px", fontWeight: "600",
                          color: STATUS_COLORS[entry.key],
                          backgroundColor: STATUS_COLORS[entry.key] + "18",
                          padding: "1px 7px", borderRadius: "20px",
                          minWidth: "38px", textAlign: "center",
                        }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
