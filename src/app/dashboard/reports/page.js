"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useFeatures } from "@/lib/useFeature";
import ExportCSVButton from "@/components/ExportCSVButton";
import { APPOINTMENTS_CSV, prepareAppointments } from "@/lib/exportCSV";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const STATUS_COLORS = {
  completed: "#22c55e",
  confirmed: "#2563eb",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const monthNames = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export default function ReportsPage() {
  const features       = useFeatures();
  const featuresLoaded = features.length > 0;
  const isLocked       = featuresLoaded && !features.includes("reports");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLocked) { setLoading(false); return; }
    api
      .get("/api/v1/dashboard/reports")
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar los reportes");
      })
      .finally(() => setLoading(false));
  }, [isLocked]);

  if (isLocked) {
    return (
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "400px", textAlign: "center", gap: "16px",
        }}
      >
        <div style={{ fontSize: "48px" }}>🔒</div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
          Función no disponible en tu plan
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "360px", margin: 0 }}>
          Los reportes avanzados están disponibles en los planes Profesional y Empresarial.
          Contacta a soporte para actualizar tu suscripción.
        </p>
        <a
          href="mailto:soporte@clinicaportal.com?subject=Actualizar plan"
          style={{
            display: "inline-block", padding: "10px 24px", borderRadius: "10px",
            backgroundColor: "#2563eb", color: "#ffffff",
            fontSize: "14px", fontWeight: "600", textDecoration: "none",
          }}
        >
          Contactar soporte →
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "300px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Cargando reportes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...cardStyle, color: "#ef4444", fontSize: "14px" }}>
        {error}
      </div>
    );
  }

  const { cancellation_stats: cs } = data;

  const pieData = [
    { name: "Completadas", value: cs.completed, key: "completed" },
    { name: "Confirmadas", value: cs.confirmed, key: "confirmed" },
    { name: "Pendientes", value: cs.pending, key: "pending" },
    { name: "Canceladas", value: cs.cancelled, key: "cancelled" },
  ].filter((d) => d.value > 0);

  const monthlyData = data.appointments_by_month.map(({ month, total }) => {
    const [year, m] = month.split("-");
    return { month: `${monthNames[parseInt(m) - 1]} ${year.slice(2)}`, total };
  });

  const statCards = [
    {
      label: "Total citas",
      value: cs.total,
      bg: "#eff6ff",
      color: "#2563eb",
      border: "#bfdbfe",
    },
    {
      label: "Completadas",
      value: cs.completed,
      bg: "#f0fdf4",
      color: "#16a34a",
      border: "#bbf7d0",
    },
    {
      label: "Canceladas",
      value: cs.cancelled,
      bg: "#fef2f2",
      color: "#dc2626",
      border: "#fecaca",
    },
    {
      label: "Tasa cancelación",
      value: `${cs.cancellation_rate}%`,
      bg: "#fffbeb",
      color: "#d97706",
      border: "#fde68a",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#0f172a",
            margin: 0,
          }}
        >
          Reportes
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
          Estadísticas generales de la clínica
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
          prepare={rows => rows.map(r => ({ ...r, status: r.status === "active" ? "Activo" : "Inactivo" }))}
        />
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: card.color,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {card.label}
            </p>
            <p
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: card.color,
                marginTop: "4px",
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Citas por mes */}
      <div style={cardStyle}>
        <p style={{ ...labelStyle, marginBottom: "4px" }}>Citas por mes</p>
        <p
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#0f172a",
            marginBottom: "20px",
          }}
        >
          Últimos 12 meses
        </p>
        {monthlyData.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "13px",
                }}
                cursor={{ fill: "#f1f5f9" }}
              />
              <Bar
                dataKey="total"
                name="Citas"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom grid */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        {/* Doctores más ocupados */}
        <div style={cardStyle}>
          <p style={{ ...labelStyle, marginBottom: "4px" }}>Doctores</p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "20px",
            }}
          >
            Más ocupados
          </p>
          {data.busiest_doctors.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.busiest_doctors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                  }}
                  cursor={{ fill: "#f1f5f9" }}
                />
                <Bar dataKey="total" name="Citas" radius={[0, 4, 4, 0]}>
                  {data.busiest_doctors.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución por estado */}
        <div style={cardStyle}>
          <p style={{ ...labelStyle, marginBottom: "4px" }}>Distribución</p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "20px",
            }}
          >
            Por estado
          </p>
          {pieData.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      {value}
                    </span>
                  )}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
