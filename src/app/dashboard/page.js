"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
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

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
};

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/dashboard/stats"),
      api.get("/api/v1/dashboard/reports"),
    ])
      .then(([statsRes, reportsRes]) => {
        setStats(statsRes.data);
        setReports(reportsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Citas hoy",
      value: stats?.appointments_today,
      description: "Programadas para hoy",
      accent: "#2563eb",
      light: "#eff6ff",
    },
    {
      title: "Doctores activos",
      value: stats?.doctors_active,
      description: "Personal disponible",
      accent: "#16a34a",
      light: "#f0fdf4",
    },
    {
      title: "Pacientes",
      value: stats?.patients_total,
      description: "Total en el sistema",
      accent: "#7c3aed",
      light: "#faf5ff",
    },
    {
      title: "Propietarios/Tutores",
      value: stats?.owners_total,
      description: "Propietarios registrados",
      accent: "#ea580c",
      light: "#fff7ed",
    },
  ];

  const quickActions = [
    {
      title: "Nueva cita",
      description: "Agenda una cita para un paciente",
      href: "/dashboard/appointments/new",
    },
    {
      title: "Registrar paciente",
      description: "Agrega un nuevo paciente al sistema",
      href: "/dashboard/patients/new",
    },
    {
      title: "Ver disponibilidad",
      description: "Consulta horarios de doctores",
      href: "/dashboard/doctors",
    },
  ];

  // Preparar datos gráficas
  const monthlyData =
    reports?.appointments_by_month?.map(({ month, total }) => {
      const [year, m] = month.split("-");
      return {
        month: `${monthNames[parseInt(m) - 1]} ${year.slice(2)}`,
        total,
      };
    }) ?? [];

  const cs = reports?.cancellation_stats;
  const pieData = cs
    ? [
        { name: "Completadas", value: cs.completed, key: "completed" },
        { name: "Confirmadas", value: cs.confirmed, key: "confirmed" },
        { name: "Pendientes", value: cs.pending, key: "pending" },
        { name: "Canceladas", value: cs.cancelled, key: "cancelled" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Bienvenida */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#0f172a" }}
        >
          Bienvenido, {user?.first_name} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Resumen de actividad — {organization?.name}
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
        }}
      >
        {statCards.map((stat) => (
          <div key={stat.title} style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#64748b",
                }}
              >
                {stat.title}
              </p>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: stat.light,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: stat.accent,
                  }}
                />
              </div>
            </div>
            {loading ? (
              <div
                style={{
                  width: "48px",
                  height: "32px",
                  borderRadius: "6px",
                  backgroundColor: "#f1f5f9",
                }}
                className="animate-pulse"
              />
            ) : (
              <p
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  color: stat.accent,
                  marginBottom: "4px",
                }}
              >
                {stat.value ?? "—"}
              </p>
            )}
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfica citas por mes */}
      <div style={cardStyle}>
        <p
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "4px",
          }}
        >
          Actividad
        </p>
        <p
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#0f172a",
            marginBottom: "20px",
          }}
        >
          Citas por mes — últimos 12 meses
        </p>
        {loading ? (
          <div
            style={{
              height: "260px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
            }}
            className="animate-pulse"
          />
        ) : monthlyData.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
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
                cursor={{ fill: "#f8fafc" }}
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

      {/* Doctores + Distribución */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Doctores más ocupados */}
        <div style={cardStyle}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "4px",
            }}
          >
            Doctores
          </p>
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
          {loading ? (
            <div
              style={{
                height: "220px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
              }}
              className="animate-pulse"
            />
          ) : !reports?.busiest_doctors?.length ? (
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reports.busiest_doctors} layout="vertical">
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
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="total" name="Citas" radius={[0, 4, 4, 0]}>
                  {reports.busiest_doctors.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución por estado */}
        <div style={cardStyle}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "4px",
            }}
          >
            Distribución
          </p>
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
          {loading ? (
            <div
              style={{
                height: "220px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
              }}
              className="animate-pulse"
            />
          ) : pieData.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
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

      {/* Accesos rápidos */}
      <div>
        <p
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "16px",
          }}
        >
          Accesos rápidos
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {quickActions.map((action) => (
            <a key={action.title} href={action.href}>
              <div
                style={{
                  ...cardStyle,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#2563eb";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(37,99,235,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#0f172a",
                    marginBottom: "4px",
                  }}
                >
                  {action.title}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    marginBottom: "12px",
                  }}
                >
                  {action.description}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#2563eb",
                  }}
                >
                  Ir al módulo →
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
