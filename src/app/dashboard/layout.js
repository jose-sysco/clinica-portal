"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { getConfig } from "@/lib/clinicConfig";
import { useFeatures } from "@/lib/useFeature";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import PaymentReminder from "@/components/PaymentReminder";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePushSubscription } from "@/lib/usePushSubscription";

// ── Icons ─────────────────────────────────────────────────────────────────────

const Icon = {
  dashboard: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  calendar: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  waitlist: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  records: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  doctors: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  patients: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  owners: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  reports: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  users: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  lock: (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  inventory: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  payments: (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
};

// ── Navigation ────────────────────────────────────────────────────────────────

const getNavGroups = (clinicType, role, features) => {
  const config = getConfig(clinicType);
  const has = (f) => features.includes(f);

  const directory = [
    {
      name: config.staffLabel || "Doctores",
      href: "/dashboard/doctors",
      icon: Icon.doctors,
    },
    {
      name: config.patientsLabel,
      href: "/dashboard/patients",
      icon: Icon.patients,
    },
  ];
  if (config.showOwners) {
    directory.push({
      name: config.ownersLabel,
      href: "/dashboard/owners",
      icon: Icon.owners,
    });
  }

  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";
  const isReceptionist = role === "receptionist";

  const operaciones = [
    { name: "Citas", href: "/dashboard/appointments", icon: Icon.calendar },
    {
      name: "Lista de espera",
      href: "/dashboard/waitlist",
      icon: Icon.waitlist,
    },
    { name: "Pagos", href: "/dashboard/payments", icon: Icon.payments },
  ];
  if (isAdmin || isDoctor) {
    operaciones.push({
      name: "Expedientes",
      href: "/dashboard/medical-records",
      icon: Icon.records,
      locked: features.length > 0 && !has("medical_records"),
    });
  }

  const groups = [
    {
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: Icon.dashboard,
          exact: true,
        },
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
        {
          name: "Reportes",
          href: "/dashboard/reports",
          icon: Icon.reports,
          locked: features.length > 0 && !has("reports"),
        },
        {
          name: "Inventario",
          href: "/dashboard/inventory",
          icon: Icon.inventory,
          locked: features.length > 0 && !has("inventory"),
        },
      ],
    });
  }

  if (isAdmin) {
    groups.push({
      label: "Administración",
      items: [
        { name: "Usuarios", href: "/dashboard/users", icon: Icon.users },
        {
          name: "Configuración",
          href: "/dashboard/settings",
          icon: Icon.settings,
        },
      ],
    });
  }

  return groups;
};

// ── Impersonation banner ──────────────────────────────────────────────────────

function ImpersonationBanner() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    try {
      const raw = Cookies.get("impersonating");
      if (raw) setInfo(JSON.parse(raw));
    } catch {
      // cookie malformada — ignorar
    }
  }, []);

  if (!info) return null;

  const handleExit = () => {
    const saToken = Cookies.get("sa_token");
    const saRefresh = Cookies.get("sa_refresh_token");

    Cookies.remove("impersonating");
    Cookies.remove("sa_token");
    Cookies.remove("sa_refresh_token");
    Cookies.remove("organization_slug");
    Cookies.remove("token");
    Cookies.remove("refresh_token");

    if (saToken) Cookies.set("token", saToken, { expires: 1 / 24 });
    if (saRefresh) Cookies.set("refresh_token", saRefresh, { expires: 30 });

    window.location.href = info.return_url || "/superadmin/organizations";
  };

  return (
    <div className="px-5 lg:px-8 py-2.5 flex items-center justify-between gap-4 bg-gradient-to-r from-amber-950 to-amber-900 border-b border-amber-800">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-amber-950">
          SUPERADMIN
        </span>
        <p className="text-sm font-medium text-amber-200">
          Estás viendo <strong>{info.org_name}</strong> como administrador
        </p>
      </div>
      <button
        onClick={handleExit}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 bg-amber-500 text-amber-950 hover:bg-amber-400 transition-colors"
      >
        Salir ←
      </button>
    </div>
  );
}

// ── Trial banner ──────────────────────────────────────────────────────────────

function TrialBanner({ organization }) {
  const expired = organization.trial_expired;
  const days = organization.trial_days_remaining;
  const used = organization.trial_appointments_used ?? 0;
  const limit = organization.trial_appointments_limit ?? 30;
  const pct = Math.min((used / limit) * 100, 100);

  const atLimit = used >= limit;
  const nearLimit = pct >= 70;
  const urgent = expired || days <= 3 || atLimit;

  const expiryDate = organization.trial_ends_at
    ? new Date(organization.trial_ends_at).toLocaleDateString("es-GT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Guatemala",
      })
    : null;

  const variant = urgent
    ? {
        wrap: "bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/60",
        text: "text-red-700 dark:text-red-300",
        track: "bg-red-200 dark:bg-red-900/60",
        bar: "bg-red-600 dark:bg-red-500",
        btn: "bg-red-600 hover:bg-red-700 text-white",
      }
    : nearLimit
      ? {
          wrap: "bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/60",
          text: "text-amber-800 dark:text-amber-300",
          track: "bg-amber-200 dark:bg-amber-900/60",
          bar: "bg-amber-600 dark:bg-amber-500",
          btn: "bg-amber-600 hover:bg-amber-700 text-white",
        }
      : {
          wrap: "bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/60",
          text: "text-blue-800 dark:text-blue-300",
          track: "bg-blue-200 dark:bg-blue-900/60",
          bar: "bg-blue-600 dark:bg-blue-500",
          btn: "bg-blue-600 hover:bg-blue-700 text-white",
        };

  return (
    <div
      className={`px-5 lg:px-8 py-3 flex items-center justify-between gap-6 ${variant.wrap}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className={`text-sm font-semibold ${variant.text}`}>
            {expired
              ? "Tu período de prueba venció"
              : atLimit
                ? "Límite de citas alcanzado — activa tu suscripción"
                : `Período de prueba${expiryDate ? ` · vence el ${expiryDate}` : ""}`}
          </p>
          {!expired && (
            <span className={`text-xs font-medium opacity-75 ${variant.text}`}>
              {days === 1 ? "1 día restante" : `${days} días restantes`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div
            className={`flex-1 h-1.5 rounded-full overflow-hidden max-w-xs ${variant.track}`}
          >
            <div
              className={`h-full rounded-full transition-all ${variant.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className={`text-xs font-semibold flex-shrink-0 ${variant.text}`}
          >
            {used}/{limit} citas
          </span>
        </div>
      </div>
      <a
        href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
        className={`text-xs font-bold px-4 py-2 rounded-lg flex-shrink-0 shadow-sm transition-colors no-underline ${variant.btn}`}
      >
        Activar →
      </a>
    </div>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ item, pathname, brandColor = "#2563eb" }) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");

  if (item.locked) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-not-allowed text-muted-foreground/40"
        title="No disponible en tu plan actual"
      >
        <span className="flex-shrink-0 text-muted-foreground/30">
          {item.icon}
        </span>
        <span className="flex-1 truncate text-xs">{item.name}</span>
        <span className="text-muted-foreground/30">{Icon.lock}</span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? "font-semibold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      style={
        isActive
          ? { backgroundColor: `${brandColor}1f`, color: brandColor }
          : undefined
      }
    >
      <span
        className={`flex-shrink-0 ${isActive ? "" : "text-muted-foreground/70"}`}
        style={isActive ? { color: brandColor } : undefined}
      >
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.name}</span>
    </Link>
  );
}

// ── Labels ────────────────────────────────────────────────────────────────────

const clinicTypeLabel = {
  veterinary: "Veterinaria",
  pediatric: "Pediatría",
  general: "Medicina General",
  dental: "Odontología",
  psychology: "Psicología",
  physiotherapy: "Fisioterapia",
  nutrition: "Nutrición",
  beauty: "Estética y Belleza",
  coaching: "Coaching",
  legal: "Servicios Legales",
  fitness: "Fitness y Deporte",
};

const getRoleLabel = (role, config) => {
  if (role === "doctor") return config.staffSingularLabel || "Doctor";
  const labels = {
    admin: "Administrador",
    receptionist: "Recepcionista",
    patient: "Paciente",
    staff: "Staff",
  };
  return labels[role] || role;
};

const roleBadgeClass = {
  admin:
    "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
  doctor:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
  receptionist:
    "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900/60",
  staff:
    "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/60",
};

// ── Push notification banner ──────────────────────────────────────────────────

function PushNotificationBanner() {
  const { permission, subscribed, loading, subscribe } = usePushSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator))
    return null;
  if (permission === "denied") return null;
  if (permission === "granted" && subscribed) return null;

  return (
    <div className="px-5 lg:px-8 py-2.5 flex items-center justify-between gap-4 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/60">
      <div className="flex items-center gap-3">
        <span className="text-lg">🔔</span>
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Activa las notificaciones push para recibir alertas de citas y stock.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={subscribe}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
        >
          {loading ? "Activando…" : "Activar"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs font-medium px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

function OrgSwitcher({ currentSlug }) {
  const [orgs, setOrgs] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("accessible_orgs");
      if (stored) setOrgs(JSON.parse(stored));
    } catch {}
  }, []);

  if (orgs.length < 2) return null;

  const handleSwitch = async (targetSlug) => {
    if (targetSlug === currentSlug) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";
      const res = await fetch(`${apiUrl}/api/v1/auth/switch_org`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target_slug: targetSlug }),
      });
      if (!res.ok) throw new Error("switch failed");
      const data = await res.json();
      Cookies.set("token", data.token, { expires: 1 / 24 });
      Cookies.set("refresh_token", data.refresh_token, { expires: 30 });
      Cookies.set("organization_slug", targetSlug, { expires: 30 });
      window.location.href = "/dashboard";
    } catch {
      import("sonner").then(({ toast }) =>
        toast.error("No se pudo cambiar de organización"),
      );
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const others = orgs.filter((o) => o.slug !== currentSlug);

  return (
    <div className="relative mx-3 mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/15"
      >
        <span>{loading ? "Cambiando…" : "Cambiar organización"}</span>
        <span className="text-[10px]">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 bg-popover border border-border shadow-xl">
          {others.map((o) => (
            <button
              key={o.slug}
              onClick={() => handleSwitch(o.slug)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-popover-foreground hover:bg-muted transition-colors"
            >
              {o.logo_url ? (
                <img
                  src={o.logo_url}
                  alt={o.name}
                  className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-border"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
                  {o.name?.[0] || "C"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs truncate">{o.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {o.plan}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const { user, organization, logout, loading, fetchMe } = useAuth();
  const features = useFeatures();
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);
  useEffect(() => {
    setLogoError(false);
  }, [organization?.logo_url]);
  useEffect(() => {
    setLogoError(false);
  }, [pathname]);

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
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black bg-gradient-to-br from-blue-800 to-blue-600 shadow-lg shadow-blue-600/30">
            C
          </div>
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`;
  const config = getConfig(organization?.clinic_type);
  const navGroups = getNavGroups(
    organization?.clinic_type,
    user?.role,
    features,
  );
  const roleClass = roleBadgeClass[user?.role] || roleBadgeClass.staff;
  const brandColor = organization?.primary_color || "#2563eb";
  const brandGradient = `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}cc 100%)`;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Backdrop móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-slate-900/45 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`w-64 fixed h-full flex flex-col z-40 transition-transform duration-300 bg-card border-r border-border shadow-md
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Org header con color de marca (siempre coloreado por la marca de la org) */}
        <div
          className="px-4 py-4 flex items-center gap-3"
          style={{ background: brandGradient }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30">
            {organization?.logo_url && !logoError ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="w-full h-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-white font-black text-sm">
                {organization?.name?.[0] || "C"}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate text-white">
              {organization?.name}
            </p>
            <p className="text-xs truncate text-white/60">
              {clinicTypeLabel[organization?.clinic_type] || "Portal médico"}
            </p>
          </div>
        </div>

        {/* Org switcher (solo visible si hay múltiples orgs en localStorage) */}
        <OrgSwitcher currentSlug={organization?.slug} />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-px">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="my-2 mx-1 h-px bg-border" />}
              <div className="flex flex-col gap-px">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    brandColor={brandColor}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer — fila única compacta */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                style={{
                  background: brandGradient,
                  boxShadow: `0 2px 6px ${brandColor}3d`,
                }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-foreground">
                  {user?.full_name}
                </p>
                <p className="text-xs truncate text-muted-foreground">
                  {getRoleLabel(user?.role, config)}
                </p>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-5 lg:px-8 py-3.5 sticky top-0 z-20 flex items-center justify-between gap-3 bg-card border-b border-border shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 bg-muted hover:bg-muted/70 border border-border text-muted-foreground transition-colors"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              {sidebarOpen ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm capitalize text-muted-foreground">
                {new Date().toLocaleDateString("es-GT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="hidden md:inline">Buscar</span>
              <kbd className="text-xs px-1.5 py-0.5 rounded hidden lg:inline bg-card border border-border font-mono text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            <NotificationBell />

            <ThemeToggle />

            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg hidden sm:inline ${roleClass}`}
            >
              {getRoleLabel(user?.role, config)}
            </span>
          </div>
        </header>

        {/* Impersonation banner */}
        <ImpersonationBanner />

        {/* Trial banner */}
        {organization?.on_trial && <TrialBanner organization={organization} />}

        {/* Recordatorio de pago — últimos 7 días del mes, solo planes de pago */}
        {!organization?.on_trial && <PaymentReminder />}

        {/* Push notification opt-in banner */}
        <PushNotificationBanner />

        {/* Content */}
        <div className="flex-1 p-5 lg:p-8 relative bg-background">
          {organization?.trial_expired && (
            <div className="absolute inset-0 z-20 flex items-start justify-center pt-24 bg-slate-900/50 backdrop-blur-sm">
              <div className="rounded-2xl p-8 text-center max-w-sm mx-4 bg-card border border-border shadow-2xl">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 bg-red-50 dark:bg-red-950/40">
                  ⏰
                </div>
                <p className="text-lg font-bold mb-2 text-foreground">
                  Período de prueba vencido
                </p>
                <p className="text-sm mb-6 text-muted-foreground">
                  Para continuar usando el sistema adquiere una suscripción.
                </p>
                <a
                  href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
                  className="inline-block text-sm font-bold px-6 py-3 rounded-xl text-white bg-gradient-to-br from-blue-700 to-blue-600 shadow-lg shadow-blue-600/40 hover:from-blue-800 hover:to-blue-700 transition-colors"
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
