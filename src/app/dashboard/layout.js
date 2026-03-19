"use client";

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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  waitlist: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  records: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  doctors: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  patients: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  owners: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
};

// ── Navigation groups ─────────────────────────────────────────────────────────

const getNavGroups = (clinicType, role, features) => {
  const config = getConfig(clinicType);
  const has    = (f) => features.includes(f);

  const directory = [
    { name: "Doctores", href: "/dashboard/doctors", icon: Icon.doctors },
    { name: config.patientsLabel, href: "/dashboard/patients", icon: Icon.patients },
  ];

  if (clinicType === "veterinary" || clinicType === "pediatric") {
    directory.push({ name: config.ownersLabel, href: "/dashboard/owners", icon: Icon.owners });
  }

  const groups = [
    {
      items: [
        { name: "Dashboard", href: "/dashboard", icon: Icon.dashboard, exact: true },
      ],
    },
    {
      label: "Operaciones",
      items: [
        { name: "Citas",          href: "/dashboard/appointments",   icon: Icon.calendar },
        { name: "Lista de espera",href: "/dashboard/waitlist",       icon: Icon.waitlist },
        {
          name:   "Expedientes",
          href:   "/dashboard/medical-records",
          icon:   Icon.records,
          locked: features.length > 0 && !has("medical_records"),
        },
      ],
    },
    {
      label: "Directorio",
      items: directory,
    },
    {
      label: "Análisis",
      items: [
        {
          name:   "Reportes",
          href:   "/dashboard/reports",
          icon:   Icon.reports,
          locked: features.length > 0 && !has("reporting"),
        },
      ],
    },
  ];

  if (role === "admin") {
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
    <div className="px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4"
      style={{ backgroundColor: urgent ? "#fef2f2" : "#fffbeb", borderBottom: `1px solid ${urgent ? "#fecaca" : "#fde68a"}` }}>
      <p className="text-xs lg:text-sm" style={{ color: urgent ? "#dc2626" : "#92400e" }}>
        {expired ? (
          <><span className="font-semibold">Tu período de prueba venció</span>{expiryDate && <span className="hidden sm:inline"> el {expiryDate}</span>}. Modo solo lectura.</>
        ) : (
          <><span className="font-semibold">{days === 1 ? "Te queda 1 día" : `Te quedan ${days} días`}</span> de prueba{expiryDate && <span className="hidden sm:inline"> — vence el {expiryDate}</span>}.</>
        )}
      </p>
      <a href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
        className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
        style={{ backgroundColor: urgent ? "#dc2626" : "#d97706", color: "#fff" }}>
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
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
        title="No disponible en tu plan actual"
        style={{ color: "#cbd5e1", cursor: "not-allowed" }}>
        <span className="flex-shrink-0" style={{ color: "#e2e8f0" }}>{item.icon}</span>
        <span className="flex-1 truncate">{item.name}</span>
        <span style={{ color: "#e2e8f0" }}>{Icon.lock}</span>
      </div>
    );
  }

  return (
    <Link href={item.href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
      style={{
        backgroundColor: isActive ? "#eff6ff" : "transparent",
        color:           isActive ? "#2563eb" : "#64748b",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.color = "#334155"; } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
    >
      <span className="flex-shrink-0" style={{ color: isActive ? "#2563eb" : "#94a3b8" }}>{item.icon}</span>
      <span className="flex-1 truncate">{item.name}</span>
      {isActive && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#2563eb" }} />}
    </Link>
  );
}

// ── Labels ────────────────────────────────────────────────────────────────────

const clinicTypeLabel = {
  veterinary:     "Veterinaria",
  pediatric:      "Pediatría",
  general:        "Medicina General",
  dental:         "Odontología",
  psychology:     "Psicología",
  physiotherapy:  "Fisioterapia",
  nutrition:      "Nutrición",
  fitness:        "Fitness",
  beauty:         "Belleza & Estética",
  coaching:       "Coaching",
  legal:          "Asesoría Legal",
};

const roleLabel = {
  admin:        "Administrador",
  doctor:       "Doctor",
  receptionist: "Recepcionista",
  patient:      "Paciente",
};

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }) {
  const { user, organization, logout, loading } = useAuth();
  const features   = useFeatures();
  const router     = useRouter();
  const pathname   = usePathname();
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f1f5f9" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "#64748b" }}>Cargando...</p>
        </div>
      </div>
    );
  }

  const initials  = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`;
  const navGroups = getNavGroups(organization?.clinic_type, user?.role, features);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f1f5f9" }}>

      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`w-64 fixed h-full flex flex-col z-40 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ backgroundColor: "#ffffff", borderRight: "1px solid #e2e8f0" }}
      >
        {/* Org header */}
        <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ backgroundColor: "#2563eb" }}>
            {organization?.name?.[0] || "C"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{organization?.name}</p>
            <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{clinicTypeLabel[organization?.clinic_type]}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-1"
                  style={{ color: "#cbd5e1" }}>
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItem key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid #f1f5f9" }}>
          <Link href="/dashboard/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors"
            style={{ color: "#334155" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold"
              style={{ backgroundColor: "#2563eb" }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{user?.full_name}</p>
              <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{roleLabel[user?.role]}</p>
            </div>
          </Link>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "#94a3b8" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "#fef2f2"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.backgroundColor = "transparent"; }}>
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
        <header className="px-4 lg:px-8 py-4 sticky top-0 z-20 flex items-center justify-between gap-3"
          style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>

          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger */}
            <button
              className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg flex-shrink-0"
              style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Abrir menú">
              <span className="block w-4 h-0.5 transition-all origin-center"
                style={{ backgroundColor: "#64748b", transform: sidebarOpen ? "rotate(45deg) translate(2px, 2px)" : "none" }} />
              <span className="block w-4 h-0.5 transition-all"
                style={{ backgroundColor: "#64748b", opacity: sidebarOpen ? 0 : 1 }} />
              <span className="block w-4 h-0.5 transition-all origin-center"
                style={{ backgroundColor: "#64748b", transform: sidebarOpen ? "rotate(-45deg) translate(2px, -2px)" : "none" }} />
            </button>

            <p className="text-sm truncate hidden sm:block capitalize" style={{ color: "#94a3b8" }}>
              {new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-sm sm:hidden" style={{ color: "#94a3b8" }}>
              {new Date().toLocaleDateString("es-GT", { day: "numeric", month: "short" })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "#64748b", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f8fafc"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="hidden md:inline">Buscar</span>
              <kbd className="text-xs px-1 py-0.5 rounded hidden lg:inline"
                style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>⌘K</kbd>
            </button>
            <NotificationBell />
            <span className="text-xs font-medium px-2.5 py-1 rounded-full hidden sm:inline"
              style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
              {roleLabel[user?.role]}
            </span>
          </div>
        </header>

        {/* Trial banner */}
        {organization?.on_trial && <TrialBanner organization={organization} />}

        {/* Content */}
        <div className="flex-1 p-4 lg:p-8 relative" style={{ backgroundColor: "#f1f5f9" }}>
          {organization?.trial_expired && (
            <div className="absolute inset-0 z-20 flex items-start justify-center pt-24"
              style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }}>
              <div className="rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl" style={{ backgroundColor: "#ffffff" }}>
                <div className="text-4xl mb-4">⏰</div>
                <p className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>Período de prueba vencido</p>
                <p className="text-sm mb-5" style={{ color: "#64748b" }}>Para continuar usando el sistema adquiere una suscripción.</p>
                <a href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
                  className="inline-block text-sm font-semibold px-5 py-2.5 rounded-xl"
                  style={{ backgroundColor: "#2563eb", color: "#fff" }}>
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
