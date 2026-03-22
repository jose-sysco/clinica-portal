"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getConfig } from "@/lib/clinicConfig";
import { useFeatures } from "@/lib/useFeature";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icon = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  calendar: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  waitlist: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  records: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  doctors: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  patients: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  owners: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    </svg>
  ),
  reports: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  users: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  lock: (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
};

// ── Navigation ────────────────────────────────────────────────────────────────

const getNavGroups = (clinicType, role, features) => {
  const config = getConfig(clinicType);
  const has    = (f) => features.includes(f);

  const directory = [
    { name: "Doctores",           href: "/dashboard/doctors",  icon: Icon.doctors  },
    { name: config.patientsLabel, href: "/dashboard/patients", icon: Icon.patients },
  ];
  if (clinicType === "veterinary" || clinicType === "pediatric") {
    directory.push({ name: config.ownersLabel, href: "/dashboard/owners", icon: Icon.owners });
  }

  const isAdmin        = role === "admin";
  const isDoctor       = role === "doctor";
  const isReceptionist = role === "receptionist";

  const operaciones = [
    { name: "Citas",           href: "/dashboard/appointments",    icon: Icon.calendar },
    { name: "Lista de espera", href: "/dashboard/waitlist",        icon: Icon.waitlist },
  ];
  if (isAdmin || isDoctor) {
    operaciones.push({
      name: "Expedientes", href: "/dashboard/medical-records", icon: Icon.records,
      locked: features.length > 0 && !has("medical_records"),
    });
  }

  const groups = [
    {
      items: [
        { name: "Dashboard", href: "/dashboard", icon: Icon.dashboard, exact: true },
      ],
    },
    {
      label: "Operaciones",
      items: operaciones,
    },
    {
      label: "Directorio",
      items: directory,
    },
  ];

  if (isAdmin || isDoctor) {
    groups.push({
      label: "Análisis",
      items: [
        { name: "Reportes", href: "/dashboard/reports", icon: Icon.reports,
          locked: features.length > 0 && !has("reports") },
      ],
    });
  }

  if (isAdmin) {
    groups.push({
      label: "Administración",
      items: [
        { name: "Usuarios",      href: "/dashboard/users",    icon: Icon.users    },
        { name: "Configuración", href: "/dashboard/settings", icon: Icon.settings },
      ],
    });
  }

  return groups;
};

// ── Trial banner ──────────────────────────────────────────────────────────────

function TrialBanner({ organization }) {
  const expired = organization.trial_expired;
  const days    = organization.trial_days_remaining;
  const urgent  = expired || days <= 3;

  const expiryDate = organization.trial_ends_at
    ? new Date(organization.trial_ends_at).toLocaleDateString("es-GT", {
        day: "numeric", month: "long", year: "numeric", timeZone: "America/Guatemala",
      })
    : null;

  return (
    <div
      className="px-5 lg:px-8 py-2.5 flex items-center justify-between gap-4"
      style={{
        background:   urgent ? "linear-gradient(90deg,#fef2f2,#fff5f5)" : "linear-gradient(90deg,#fffbeb,#fffef0)",
        borderBottom: `1px solid ${urgent ? "#fecaca" : "#fde68a"}`,
      }}
    >
      <p className="text-sm" style={{ color: urgent ? "#dc2626" : "#92400e" }}>
        {expired ? (
          <><strong>Tu período de prueba venció</strong>{expiryDate && <span className="hidden sm:inline"> el {expiryDate}</span>}. Solo lectura.</>
        ) : (
          <><strong>{days === 1 ? "Te queda 1 día" : `Te quedan ${days} días`}</strong> de prueba{expiryDate && <span className="hidden sm:inline"> · vence el {expiryDate}</span>}.</>
        )}
      </p>
      <a
        href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
        className="text-xs font-bold px-4 py-2 rounded-lg flex-shrink-0"
        style={{ background: urgent ? "#dc2626" : "#d97706", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
      >
        Activar →
      </a>
    </div>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ item, pathname }) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  if (item.locked) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"
        title="No disponible en tu plan actual"
        style={{ color: "#d1d9e3", cursor: "not-allowed" }}
      >
        <span style={{ color: "#dde3ec", flexShrink: 0 }}>{item.icon}</span>
        <span className="flex-1 truncate">{item.name}</span>
        <span style={{ color: "#dde3ec" }}>{Icon.lock}</span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={
        isActive
          ? {
              background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              color:      "#ffffff",
              boxShadow:  "0 2px 10px rgba(37,99,235,0.3)",
            }
          : { color: "#64748b" }
      }
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "#f1f5f9";
          e.currentTarget.style.color = "#1e293b";
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#64748b";
        }
      }}
    >
      <span style={{ color: isActive ? "rgba(255,255,255,0.85)" : "#94a3b8", flexShrink: 0 }}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.name}</span>
    </Link>
  );
}

// ── Labels ────────────────────────────────────────────────────────────────────

const clinicTypeLabel = {
  veterinary:    "Veterinaria",
  pediatric:     "Pediatría",
  general:       "Medicina General",
  dental:        "Odontología",
  psychology:    "Psicología",
  physiotherapy: "Fisioterapia",
  nutrition:     "Nutrición",
  beauty:        "Estética y Belleza",
  coaching:      "Coaching",
  legal:         "Servicios Legales",
  fitness:       "Fitness y Deporte",
};

const roleLabel = {
  admin:        "Administrador",
  doctor:       "Doctor",
  receptionist: "Recepcionista",
  patient:      "Paciente",
  staff:        "Staff",
};

const roleBadgeStyle = {
  admin:        { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
  doctor:       { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" },
  receptionist: { background: "#fdf4ff", color: "#7e22ce", border: "1px solid #e9d5ff" },
  staff:        { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" },
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }) {
  const { user, organization, logout, loading, fetchMe } = useAuth();
  const features      = useFeatures();
  const router        = useRouter();
  const pathname      = usePathname();
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [logoError,   setLogoError]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);
  useEffect(() => { setLogoError(false); }, [organization?.logo_url]);
  useEffect(() => { setLogoError(false); }, [pathname]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

  // If after loading completes the org still has no logo_url, do a fresh fetchMe.
  // This handles stale AuthProvider state (e.g., provider mounted before logo was added).
  useEffect(() => {
    if (!loading && organization && !organization.logo_url) fetchMe();
  }, [loading]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black"
            style={{ background: "linear-gradient(135deg,#1e40af,#2563eb)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}
          >
            C
          </div>
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const initials  = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`;
  const navGroups = getNavGroups(organization?.clinic_type, user?.role, features);
  const roleStyle = roleBadgeStyle[user?.role] || roleBadgeStyle.staff;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f1f5f9" }}>

      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`w-64 fixed h-full flex flex-col z-40 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{
          backgroundColor: "#ffffff",
          borderRight:     "1px solid #e8edf3",
          boxShadow:       "2px 0 24px rgba(15,23,42,0.07)",
        }}
      >
        {/* Org header con gradiente */}
        <div
          className="px-5 py-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              backdropFilter:  "blur(4px)",
              border:          "1px solid rgba(255,255,255,0.28)",
            }}
          >
            {organization?.logo_url && !logoError ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-white font-black text-base">{organization?.name?.[0] || "C"}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#ffffff" }}>
              {organization?.name}
            </p>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.55)" }}>
              {clinicTypeLabel[organization?.clinic_type] || "Portal médico"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-2" : ""}>
              {group.label && (
                <p
                  className="px-3 mb-1.5 mt-1"
                  style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b0bac8" }}
                >
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map(item => (
                  <NavItem key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid #f0f4f8" }}>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
              style={{
                background:  "linear-gradient(135deg,#1d4ed8,#2563eb)",
                boxShadow:   "0 2px 8px rgba(37,99,235,0.3)",
                flexShrink:  0,
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{user?.full_name}</p>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full inline-block"
                style={roleStyle}
              >
                {roleLabel[user?.role]}
              </span>
            </div>
          </Link>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: "#94a3b8" }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#dc2626";
              e.currentTarget.style.backgroundColor = "#fff5f5";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Header */}
        <header
          className="px-5 lg:px-8 py-3.5 sticky top-0 z-20 flex items-center justify-between gap-3"
          style={{
            backgroundColor: "#ffffff",
            borderBottom:    "1px solid #e8edf3",
            boxShadow:       "0 1px 8px rgba(15,23,42,0.05)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors"
              style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b" }}
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Abrir menú"
            >
              {sidebarOpen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              <p className="text-sm capitalize" style={{ color: "#94a3b8" }}>
                {new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm"
              style={{ color: "#64748b", backgroundColor: "#f8fafc", border: "1px solid #e8edf3" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.borderColor = "#d1d9e3"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.borderColor = "#e8edf3"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="hidden md:inline">Buscar</span>
              <kbd className="text-xs px-1.5 py-0.5 rounded hidden lg:inline" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", fontFamily: "monospace", color: "#94a3b8" }}>⌘K</kbd>
            </button>

            <NotificationBell />

            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hidden sm:inline"
              style={roleStyle}
            >
              {roleLabel[user?.role]}
            </span>
          </div>
        </header>

        {/* Trial banner */}
        {organization?.on_trial && <TrialBanner organization={organization} />}

        {/* Content */}
        <div className="flex-1 p-5 lg:p-8 relative" style={{ backgroundColor: "#f1f5f9" }}>
          {organization?.trial_expired && (
            <div
              className="absolute inset-0 z-20 flex items-start justify-center pt-24"
              style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
            >
              <div
                className="rounded-2xl p-8 text-center max-w-sm mx-4"
                style={{ backgroundColor: "#ffffff", boxShadow: "0 20px 60px rgba(15,23,42,0.25)" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
                  style={{ background: "#fef2f2" }}
                >
                  ⏰
                </div>
                <p className="text-lg font-bold mb-2" style={{ color: "#0f172a" }}>Período de prueba vencido</p>
                <p className="text-sm mb-6" style={{ color: "#64748b" }}>Para continuar usando el sistema adquiere una suscripción.</p>
                <a
                  href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
                  className="inline-block text-sm font-bold px-6 py-3 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" }}
                >
                  Contactar para activar →
                </a>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
