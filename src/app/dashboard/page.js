"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#2563eb","#22c55e","#f59e0b","#ef4444","#8b5cf6","#ec4899"];
const STATUS_COLORS = { completed: "#22c55e", confirmed: "#2563eb", pending: "#f59e0b", cancelled: "#ef4444" };
const STATUS_LABEL  = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada" };
const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function Trend({ value }) {
  if (value == null) return <span style={{ fontSize: "11px", color: "#94a3b8" }}>—</span>;
  const up    = value >= 0;
  const color = up ? "#16a34a" : "#dc2626";
  return (
    <span style={{ fontSize: "11px", fontWeight: "600", color }}>
      {up ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

function Skeleton({ h = 32, w }) {
  return <div className="animate-pulse rounded-lg" style={{ height: h, width: w || "100%", backgroundColor: "#f1f5f9" }} />;
}

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const router = useRouter();
  const [stats,        setStats]        = useState(null);
  const [reports,      setReports]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showOnboard,  setShowOnboard]  = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/dashboard/stats"),
      api.get("/api/v1/dashboard/reports"),
      api.get("/api/v1/doctors", { params: { per_page: 1 } }),
    ])
      .then(([s, r, d]) => {
        setStats(s.data);
        setReports(r.data);
        // Show onboarding banner for admins when no doctors and wizard not done
        if (user?.role === "admin" && d.data.pagination?.count === 0) {
          try {
            const done = localStorage.getItem(`onboarding_done_${organization?.id}`);
            if (!done) setShowOnboard(true);
          } catch { setShowOnboard(true); }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const monthlyData = reports?.appointments_by_month?.map(({ month, total }) => {
    const [year, m] = month.split("-");
    return { month: `${monthNames[parseInt(m) - 1]} ${year.slice(2)}`, total };
  }) ?? [];

  const cs = reports?.cancellation_stats;
  const pieData = cs
    ? [
        { name: "Completadas", value: cs.completed, key: "completed" },
        { name: "Confirmadas", value: cs.confirmed, key: "confirmed" },
        { name: "Pendientes",  value: cs.pending,   key: "pending"   },
        { name: "Canceladas",  value: cs.cancelled,  key: "cancelled" },
      ].filter((d) => d.value > 0)
    : [];

  const card = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
  };

  return (
    <div className="space-y-6">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
            {greeting}, {user?.first_name} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {organization?.name} · {new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <span className="text-xs" style={{ color: "#94a3b8" }}>Búsqueda rápida</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#64748b", fontFamily: "monospace" }}>⌘K</kbd>
        </div>
      </div>

      {/* ── Onboarding banner ─────────────────────────────────────────── */}
      {showOnboard && (
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)", border: "none" }}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              🚀
            </div>
            <div>
              <p className="text-base font-bold text-white mb-1">Completa la configuración inicial</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                Agrega tu primer profesional y configura su horario para empezar a agendar citas en minutos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push("/dashboard/onboarding")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#ffffff", color: "#2563eb" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
            >
              Iniciar configuración →
            </button>
            <button
              onClick={() => {
                try { localStorage.setItem(`onboarding_done_${organization?.id}`, "1"); } catch {}
                setShowOnboard(false);
              }}
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Omitir
            </button>
          </div>
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">

        {/* Citas hoy — hero card */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 8px 28px rgba(37,99,235,0.32)",
          }}
        >
          {/* decorative circle */}
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-30px", right: "30px", width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

          <div className="flex items-center justify-between mb-3 relative">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.65)" }}>Citas hoy</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px" }}>◷</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className="text-5xl font-black mb-3 relative" style={{ color: "#ffffff" }}>{stats?.appointments_today ?? "—"}</p>
          )}
          <div className="flex gap-2 flex-wrap relative">
            {loading ? <Skeleton h={20} w={160} /> : (
              <>
                {stats?.today_pending   > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fde68a" }}>{stats.today_pending} pend.</span>}
                {stats?.today_confirmed > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#bfdbfe" }}>{stats.today_confirmed} conf.</span>}
                {stats?.today_completed > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#bbf7d0" }}>{stats.today_completed} comp.</span>}
                {stats?.appointments_today === 0 && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Sin citas programadas</span>}
              </>
            )}
          </div>
        </div>

        {/* Esta semana */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Esta semana</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
              <span style={{ color: "#16a34a", fontSize: "14px" }}>⊞</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className="text-4xl font-black mb-1" style={{ color: "#0f172a" }}>{stats?.appointments_this_week ?? "—"}</p>
          )}
          {loading ? <Skeleton h={16} w={100} /> : (
            <div className="flex items-center gap-1.5 mt-2">
              <Trend value={stats?.week_change} />
              <span className="text-xs" style={{ color: "#94a3b8" }}>vs semana pasada ({stats?.appointments_last_week ?? 0})</span>
            </div>
          )}
        </div>

        {/* Nuevos pacientes */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Nuevos pacientes</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#faf5ff" }}>
              <span style={{ color: "#7c3aed", fontSize: "14px" }}>♡</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className="text-4xl font-black mb-1" style={{ color: "#0f172a" }}>{stats?.patients_this_week ?? "—"}</p>
          )}
          {loading ? <Skeleton h={16} w={100} /> : (
            <div className="flex items-center gap-1.5 mt-2">
              <Trend value={stats?.patients_change} />
              <span className="text-xs" style={{ color: "#94a3b8" }}>vs semana pasada ({stats?.patients_last_week ?? 0})</span>
            </div>
          )}
        </div>

        {/* Tasa de asistencia */}
        <div style={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Asistencia</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#fff7ed" }}>
              <span style={{ color: "#ea580c", fontSize: "14px" }}>✓</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className="text-4xl font-black mb-1" style={{ color: stats?.attendance_rate >= 80 ? "#16a34a" : stats?.attendance_rate >= 60 ? "#d97706" : "#dc2626" }}>
              {stats?.attendance_rate != null ? `${stats.attendance_rate}%` : "—"}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>Últimos 30 días · citas completadas</p>
        </div>
      </div>

      {/* ── Horas pico + Próximas citas hoy ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">

        {/* Horas pico */}
        <div className="lg:col-span-2" style={card}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Actividad</p>
          <p className="text-base font-semibold mb-4" style={{ color: "#0f172a" }}>Horas pico esta semana</p>
          {loading ? <Skeleton h={180} /> : !stats?.peak_hours?.length ? (
            <div className="flex items-center justify-center h-44">
              <p className="text-sm" style={{ color: "#94a3b8" }}>Sin datos esta semana</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.peak_hours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(v) => [v, "Citas"]}
                />
                <Bar dataKey="count" name="Citas" fill="#2563eb" radius={[4, 4, 0, 0]}>
                  {stats.peak_hours.map((_, i) => (
                    <Cell key={i} fill={`rgba(37,99,235,${0.4 + (i / stats.peak_hours.length) * 0.6})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Próximas citas hoy */}
        <div style={{ ...card, display: "flex", flexDirection: "column" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Agenda</p>
              <p className="text-base font-semibold mt-0.5" style={{ color: "#0f172a" }}>Próximas hoy</p>
            </div>
            <Link href="/dashboard/appointments">
              <span className="text-xs font-medium" style={{ color: "#2563eb", cursor: "pointer" }}>Ver todas →</span>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} h={52} />)}
            </div>
          ) : !stats?.upcoming_today?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "#f1f5f9" }}>
                <span style={{ fontSize: "20px" }}>◷</span>
              </div>
              <p className="text-sm font-medium" style={{ color: "#64748b" }}>Sin citas pendientes</p>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>No hay más citas por hoy</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {stats.upcoming_today.map((appt) => (
                <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                    style={{ backgroundColor: "#f8fafc" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[appt.status] + "20" }}>
                      <span className="text-sm font-bold" style={{ color: STATUS_COLORS[appt.status] }}>{appt.time}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{appt.patient_name}</p>
                      <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{appt.doctor_name}</p>
                    </div>
                    <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[appt.status] + "15", color: STATUS_COLORS[appt.status] }}>
                      {STATUS_LABEL[appt.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Gráficas históricas ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <div style={card}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Histórico</p>
          <p className="text-base font-semibold mb-4" style={{ color: "#0f172a" }}>Citas por mes — últimos 12 meses</p>
          {loading ? <Skeleton h={220} /> : monthlyData.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="total" name="Citas" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>Distribución</p>
          <p className="text-base font-semibold mb-4" style={{ color: "#0f172a" }}>Estado de citas (total)</p>
          {loading ? <Skeleton h={220} /> : pieData.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#94a3b8" }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.key]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: "12px", color: "#64748b" }}>{v}</span>} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Accesos rápidos ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Accesos rápidos</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Nueva cita",         description: "Agenda una cita para un paciente",    href: "/dashboard/appointments/new", color: "#2563eb", bg: "#eff6ff", icon: "📅" },
            { title: "Registrar paciente", description: "Agrega un nuevo paciente al sistema",  href: "/dashboard/patients/new",      color: "#7c3aed", bg: "#faf5ff", icon: "👤" },
            { title: "Ver disponibilidad", description: "Consulta horarios de doctores",        href: "/dashboard/doctors",           color: "#16a34a", bg: "#f0fdf4", icon: "🩺" },
          ].map((action) => (
            <Link key={action.title} href={action.href}>
              <div
                style={{ ...card, cursor: "pointer", transition: "all 0.18s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.boxShadow   = `0 8px 24px ${action.color}22`;
                  e.currentTarget.style.transform   = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow   = "0 1px 4px rgba(15,23,42,0.06)";
                  e.currentTarget.style.transform   = "translateY(0)";
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl" style={{ backgroundColor: action.bg }}>
                  {action.icon}
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: "#0f172a" }}>{action.title}</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{action.description}</p>
                <p className="text-xs font-semibold mt-3" style={{ color: action.color }}>Ir →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
