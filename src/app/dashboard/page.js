"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_HEX,
  ALERT_VARIANTS,
  appointmentStatus,
} from "@/lib/statusColors";

const monthNames = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Colores de chart que funcionan razonablemente en light y dark.
const CHART_GRID   = "rgba(148, 163, 184, 0.2)";   // slate-400 @ 20%
const CHART_TICK   = "#94a3b8";                    // slate-400
const CHART_TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid rgba(148, 163, 184, 0.3)",
  fontSize: "12px",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
};

const cardClass = "rounded-2xl p-6 bg-card border border-border shadow-sm";

function Trend({ value }) {
  if (value == null) return <span className="text-[11px] text-muted-foreground">—</span>;
  const up = value >= 0;
  return (
    <span className={`text-[11px] font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

function Skeleton({ h = 32, w }) {
  return <div className="animate-pulse rounded-lg bg-muted" style={{ height: h, width: w || "100%" }} />;
}

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const router = useRouter();
  const [stats,       setStats]       = useState(null);
  const [charts,      setCharts]      = useState(null);
  const [alerts,      setAlerts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showOnboard, setShowOnboard] = useState(false);

  const fetchAll = useCallback(() => {
    return Promise.all([
      api.get("/api/v1/dashboard/stats"),
      api.get("/api/v1/dashboard/charts"),
      api.get("/api/v1/dashboard/alerts"),
      api.get("/api/v1/doctors", { params: { per_page: 1 } }),
    ])
      .then(([s, c, a, d]) => {
        setStats(s.data);
        setCharts(c.data);
        setAlerts(a.data.alerts || []);
        if (user?.role === "admin" && d.data.pagination?.count === 0) {
          try {
            const done = localStorage.getItem(`onboarding_done_${organization?.id}`);
            if (!done) {
              router.push("/dashboard/onboarding");
              return;
            }
          } catch {
            router.push("/dashboard/onboarding");
            return;
          }
          setShowOnboard(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, organization]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const monthlyData = charts?.appointments_by_month?.map(({ month, total }) => {
    const [year, m] = month.split("-");
    return { month: `${monthNames[parseInt(m) - 1]} ${year.slice(2)}`, total };
  }) ?? [];

  const cs = charts?.cancellation_stats;
  const pieData = cs
    ? [
        { name: "Completadas", value: cs.completed, key: "completed" },
        { name: "Confirmadas", value: cs.confirmed, key: "confirmed" },
        { name: "Pendientes",  value: cs.pending,   key: "pending"   },
        { name: "Canceladas",  value: cs.cancelled, key: "cancelled" },
      ].filter((d) => d.value > 0)
    : [];

  // Color de "asistencia" según rango
  const attendanceTone = (rate) =>
    rate == null ? "text-foreground"
      : rate >= 80 ? "text-emerald-600 dark:text-emerald-400"
      : rate >= 60 ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  // Color de NPS según score
  const npsTone = (score) =>
    score >= 50 ? "text-emerald-600 dark:text-emerald-400"
      : score >= 0 ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  const npsBar = (score) =>
    score >= 50 ? "bg-emerald-500"
      : score >= 0 ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="space-y-6">

      {/* ── Greeting ─────────────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {greeting}, {user?.first_name} 👋
          </h1>
          <p className="text-sm mt-0.5 text-muted-foreground">
            {organization?.name} · {new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
          <span className="text-xs text-muted-foreground">Búsqueda rápida</span>
          <kbd className="text-xs px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground font-mono">⌘K</kbd>
        </div>
      </div>

      {/* ── Onboarding banner ─────────────────────────────────────────── */}
      {showOnboard && (
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-white/15">
              🚀
            </div>
            <div>
              <p className="text-base font-bold mb-1">Completa la configuración inicial</p>
              <p className="text-sm text-white/80">
                Agrega tu primer profesional y configura su horario para empezar a agendar citas en minutos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push("/dashboard/onboarding")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-blue-700 hover:bg-blue-50 transition-colors"
            >
              Iniciar configuración →
            </button>
            <button
              onClick={() => {
                try { localStorage.setItem(`onboarding_done_${organization?.id}`, "1"); } catch {}
                setShowOnboard(false);
              }}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Omitir
            </button>
          </div>
        </div>
      )}

      {/* ── Alertas operacionales ─────────────────────────────────────── */}
      {!loading && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const v = ALERT_VARIANTS[alert.type] || ALERT_VARIANTS.info;
            return (
              <div
                key={alert.key}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm border ${v.bg} ${v.border}`}
              >
                <span className="text-base flex-shrink-0">{v.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${v.title}`}>{alert.title}</p>
                  <p className={`text-xs mt-0.5 ${v.text}`}>{alert.message}</p>
                </div>
                {alert.key === "doctors_without_schedule" && (
                  <Link href="/dashboard/doctors">
                    <button className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${v.button}`}>
                      Ver doctores →
                    </button>
                  </Link>
                )}
                {alert.key === "pending_today" && (
                  <Link href="/dashboard/appointments?status=pending">
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                      Ver citas →
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">

        {/* Citas hoy — hero card (gradient, siempre azul) */}
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600 shadow-xl shadow-blue-600/30">
          <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-7 right-8 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />

          <div className="flex items-center justify-between mb-3 relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/65">Citas hoy</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/15">
              <span className="text-white/90 text-sm">◷</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className="text-5xl font-black mb-3 relative text-white">{stats?.appointments_today ?? "—"}</p>
          )}
          <div className="flex gap-2 flex-wrap relative">
            {loading ? <Skeleton h={20} w={160} /> : (
              <>
                {stats?.today_pending   > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/15 text-amber-200">{stats.today_pending} pend.</span>}
                {stats?.today_confirmed > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/15 text-blue-200">{stats.today_confirmed} conf.</span>}
                {stats?.today_completed > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/15 text-emerald-200">{stats.today_completed} comp.</span>}
                {stats?.appointments_today === 0 && <span className="text-xs text-white/40">Sin citas programadas</span>}
              </>
            )}
          </div>
        </div>

        {/* Esta semana */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Esta semana</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40">
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">⊞</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className="text-4xl font-black mb-1 text-foreground">{stats?.appointments_this_week ?? "—"}</p>
          )}
          {loading ? <Skeleton h={16} w={100} /> : (
            <div className="flex items-center gap-1.5 mt-2">
              <Trend value={stats?.week_change} />
              <span className="text-xs text-muted-foreground">vs semana pasada ({stats?.appointments_last_week ?? 0})</span>
            </div>
          )}
        </div>

        {/* Nuevos pacientes */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nuevos pacientes</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-950/40">
              <span className="text-violet-600 dark:text-violet-400 text-sm">♡</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className="text-4xl font-black mb-1 text-foreground">{stats?.patients_this_week ?? "—"}</p>
          )}
          {loading ? <Skeleton h={16} w={100} /> : (
            <div className="flex items-center gap-1.5 mt-2">
              <Trend value={stats?.patients_change} />
              <span className="text-xs text-muted-foreground">vs semana pasada ({stats?.patients_last_week ?? 0})</span>
            </div>
          )}
        </div>

        {/* Tasa de asistencia */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Asistencia</p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 dark:bg-orange-950/40">
              <span className="text-orange-600 dark:text-orange-400 text-sm">✓</span>
            </div>
          </div>
          {loading ? <Skeleton h={40} w={80} /> : (
            <p className={`text-4xl font-black mb-1 ${attendanceTone(stats?.attendance_rate)}`}>
              {stats?.attendance_rate != null ? `${stats.attendance_rate}%` : "—"}
            </p>
          )}
          <p className="text-xs mt-2 text-muted-foreground">Últimos 30 días · citas completadas</p>
        </div>
      </div>

      {/* ── NPS ──────────────────────────────────────────────────────────── */}
      {stats?.nps?.total > 0 && (
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Satisfacción de pacientes</p>
              <p className="text-xs mt-0.5 text-muted-foreground/70">Últimos 90 días · {stats.nps.total} respuesta{stats.nps.total !== 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${npsTone(stats.nps.score)}`}>
                {stats.nps.score > 0 ? "+" : ""}{stats.nps.score}
              </p>
              <p className="text-xs text-muted-foreground">NPS Score</p>
            </div>
          </div>
          <div className="flex gap-3">
            {[
              { label: "Promotores",  count: stats.nps.promoters,  text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", desc: "9-10" },
              { label: "Pasivos",     count: stats.nps.passives,   text: "text-amber-700 dark:text-amber-300",     bg: "bg-amber-50 dark:bg-amber-950/40",     desc: "7-8" },
              { label: "Detractores", count: stats.nps.detractors, text: "text-red-700 dark:text-red-300",         bg: "bg-red-50 dark:bg-red-950/40",         desc: "1-6" },
            ].map((g) => (
              <div key={g.label} className={`flex-1 rounded-xl p-3 text-center ${g.bg}`}>
                <p className={`text-xl font-bold ${g.text}`}>{g.count}</p>
                <p className={`text-xs font-medium ${g.text}`}>{g.label}</p>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Promedio: <strong className="text-foreground">{stats.nps.average}/10</strong>
            </p>
            <div className="h-2 flex-1 mx-3 rounded-full overflow-hidden bg-muted">
              <div className={`h-full rounded-full ${npsBar(stats.nps.score)}`} style={{ width: `${(stats.nps.average / 10) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Horas pico + Próximas citas hoy ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">

        {/* Horas pico */}
        <div className={`lg:col-span-2 ${cardClass}`}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-muted-foreground">Actividad</p>
          <p className="text-base font-semibold mb-4 text-foreground">Horas pico esta semana</p>
          {loading ? <Skeleton h={180} /> : !stats?.peak_hours?.length ? (
            <div className="flex items-center justify-center h-44">
              <p className="text-sm text-muted-foreground">Sin datos esta semana</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.peak_hours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                  formatter={(v) => [v, "Citas"]}
                />
                <Bar dataKey="count" name="Citas" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {stats.peak_hours.map((entry, i) => (
                    <Cell key={entry.hour} fill={`rgba(59, 130, 246, ${0.4 + (i / stats.peak_hours.length) * 0.6})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Próximas citas hoy */}
        <div className={`${cardClass} flex flex-col`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Agenda</p>
              <p className="text-base font-semibold mt-0.5 text-foreground">Próximas hoy</p>
            </div>
            <Link href="/dashboard/appointments">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Ver todas →</span>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} h={52} />)}
            </div>
          ) : !stats?.upcoming_today?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-muted">
                <span className="text-xl">◷</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Sin citas pendientes</p>
              <p className="text-xs mt-1 text-muted-foreground/70">No hay más citas por hoy</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {stats.upcoming_today.map((appt) => {
                const st = appointmentStatus(appt.status);
                return (
                  <Link key={appt.id} href={`/dashboard/appointments/${appt.id}`}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer bg-muted/40 hover:bg-muted transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                        <span className={`text-sm font-bold ${st.text}`}>{appt.time}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-foreground">{appt.patient_name}</p>
                        <p className="text-xs truncate text-muted-foreground">{appt.doctor_name}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Gráficas históricas ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <div className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-muted-foreground">Histórico</p>
          <p className="text-base font-semibold mb-4 text-foreground">Citas por mes — últimos 12 meses</p>
          {loading ? <Skeleton h={220} /> : monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "rgba(148, 163, 184, 0.1)" }} />
                <Bar dataKey="total" name="Citas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-muted-foreground">Distribución</p>
          <p className="text-base font-semibold mb-4 text-foreground">Estado de citas (total)</p>
          {loading ? <Skeleton h={220} /> : pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={APPOINTMENT_STATUS_HEX[entry.key]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Accesos rápidos ───────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground">Accesos rápidos</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Nueva cita",         description: "Agenda una cita para un paciente",      href: "/dashboard/appointments/new", iconWrap: "bg-blue-50 dark:bg-blue-950/40",     accent: "text-blue-600 dark:text-blue-400",     hover: "hover:border-blue-400 dark:hover:border-blue-600", icon: "📅" },
            { title: "Registrar paciente", description: "Agrega un nuevo paciente al sistema",   href: "/dashboard/patients/new",     iconWrap: "bg-violet-50 dark:bg-violet-950/40", accent: "text-violet-600 dark:text-violet-400", hover: "hover:border-violet-400 dark:hover:border-violet-600", icon: "👤" },
            { title: "Ver disponibilidad", description: "Consulta horarios de doctores",         href: "/dashboard/doctors",          iconWrap: "bg-emerald-50 dark:bg-emerald-950/40", accent: "text-emerald-600 dark:text-emerald-400", hover: "hover:border-emerald-400 dark:hover:border-emerald-600", icon: "🩺" },
          ].map((action) => (
            <Link key={action.title} href={action.href}>
              <div className={`${cardClass} cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg ${action.hover}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl ${action.iconWrap}`}>
                  {action.icon}
                </div>
                <p className="text-sm font-bold mb-1 text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
                <p className={`text-xs font-semibold mt-3 ${action.accent}`}>Ir →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
