"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getConfig } from "@/lib/clinicConfig";
import { useFeatures } from "@/lib/useFeature";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";

function TrialBanner({ organization }) {
  const expired = organization.trial_expired;
  const days = organization.trial_days_remaining;
  const urgent = expired || days <= 3;

  const expiryDate = organization.trial_ends_at
    ? new Date(organization.trial_ends_at).toLocaleDateString("es-GT", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Guatemala",
      })
    : null;

  return (
    <div
      className="px-8 py-2.5 flex items-center justify-between gap-4"
      style={{
        backgroundColor: urgent ? "#fef2f2" : "#fffbeb",
        borderBottom: `1px solid ${urgent ? "#fecaca" : "#fde68a"}`,
      }}
    >
      <p className="text-sm" style={{ color: urgent ? "#dc2626" : "#92400e" }}>
        {expired ? (
          <>
            <span className="font-semibold">Tu período de prueba venció</span>
            {expiryDate && (
              <span style={{ color: urgent ? "#ef4444" : "#b45309" }}>
                {" "}el {expiryDate}
              </span>
            )}
            . El sistema está en modo solo lectura.
          </>
        ) : (
          <>
            <span className="font-semibold">
              {days === 1 ? "Te queda 1 día" : `Te quedan ${days} días`}
            </span>{" "}
            de prueba gratuita
            {expiryDate && (
              <span style={{ color: urgent ? "#ef4444" : "#b45309" }}>
                {" "}— vence el {expiryDate}
              </span>
            )}
            .
          </>
        )}
      </p>
      <a
        href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
        className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
        style={{
          backgroundColor: urgent ? "#dc2626" : "#d97706",
          color: "#ffffff",
        }}
      >
        Activar suscripción →
      </a>
    </div>
  );
}

const getNavigation = (clinicType, role, features) => {
  const config = getConfig(clinicType);
  const has = (f) => features.includes(f);

  const base = [
    { name: "Dashboard",  href: "/dashboard",              icon: "⊞" },
    { name: "Citas",      href: "/dashboard/appointments", icon: "◷", feature: "appointments" },
    { name: "Doctores",   href: "/dashboard/doctors",      icon: "✚" },
    { name: config.patientsLabel, href: "/dashboard/patients", icon: "♡" },
  ];

  if (clinicType === "veterinary" || clinicType === "pediatric") {
    base.push({ name: config.ownersLabel, href: "/dashboard/owners", icon: "◎" });
  }

  // Feature-gated items
  base.push({
    name:    "Expedientes",
    href:    "/dashboard/medical-records",
    icon:    "📋",
    feature: "medical_records",
    locked:  features.length > 0 && !has("medical_records"),
  });

  base.push({
    name:    "Reportes",
    href:    "/dashboard/reports",
    icon:    "◈",
    feature: "reporting",
    locked:  features.length > 0 && !has("reporting"),
  });

  if (role === "admin") {
    base.push({ name: "Usuarios", href: "/dashboard/users", icon: "👥" });
  }

  return base;
};

const clinicTypeLabel = {
  veterinary: "Veterinaria",
  pediatric:  "Pediatría",
  general:    "Medicina General",
  dental:     "Odontología",
  psychology: "Psicología",
};

const roleLabel = {
  admin: "Administrador",
  doctor: "Doctor",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

export default function DashboardLayout({ children }) {
  const { user, organization, logout, loading } = useAuth();
  const features = useFeatures();
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f5f9" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: "#64748b" }}>
            Cargando...
          </p>
        </div>
      </div>
    );
  }

  const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`;
  const navigation = getNavigation(organization?.clinic_type, user?.role, features);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside
        className="w-64 fixed h-full flex flex-col"
        style={{ backgroundColor: "#ffffff", borderRight: "1px solid #e2e8f0" }}
      >
        {/* Logo */}
        <div
          className="px-6 py-5"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#2563eb" }}
            >
              <span className="text-white text-sm font-bold">
                {organization?.name?.[0] || "C"}
              </span>
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "#0f172a" }}
              >
                {organization?.name}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                {clinicTypeLabel[organization?.clinic_type]}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p
            className="text-xs font-medium uppercase tracking-widest px-3 mb-3"
            style={{ color: "#94a3b8" }}
          >
            Menú
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            if (item.locked) {
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
                  title="No disponible en tu plan actual"
                  style={{ color: "#cbd5e1", cursor: "not-allowed" }}
                >
                  <span>{item.icon}</span>
                  <span className="flex-1">{item.name}</span>
                  <span className="text-xs" style={{ color: "#e2e8f0" }}>🔒</span>
                </div>
              );
            }
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "#eff6ff" : "transparent",
                  color: isActive ? "#2563eb" : "#64748b",
                }}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid #e2e8f0" }}>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-lg mb-2"
            style={{ backgroundColor: "#f8fafc" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#2563eb" }}
            >
              <span className="text-white text-xs font-semibold">
                {initials}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "#0f172a" }}
              >
                {user?.full_name}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                {roleLabel[user?.role]}
              </p>
            </div>
          </div>

          <Link href="/dashboard/profile">
            <button
              className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors mb-1"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#0f172a";
                e.currentTarget.style.backgroundColor = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Mi perfil
            </button>
          </Link>

          <button
            onClick={logout}
            className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
            style={{ color: "#94a3b8" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.backgroundColor = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="px-8 py-4 sticky top-0 z-10 flex items-center justify-between"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {new Date().toLocaleDateString("es-GT", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "#64748b", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
            >
              <span>⌕</span>
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="text-xs px-1 py-0.5 rounded hidden sm:inline" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>⌘K</kbd>
            </button>
            <NotificationBell />
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                color: "#2563eb",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              {roleLabel[user?.role]}
            </span>
          </div>
        </header>

        {/* Banner de trial */}
        {organization?.on_trial && (
          <TrialBanner organization={organization} />
        )}

        {/* Content — bloqueado si el trial venció */}
        <div className="flex-1 p-8 relative" style={{ backgroundColor: "#f1f5f9" }}>
          {organization?.trial_expired && (
            <div
              className="absolute inset-0 z-20 flex items-start justify-center pt-24"
              style={{ backgroundColor: "rgba(15,23,42,0.45)", backdropFilter: "blur(2px)" }}
            >
              <div
                className="rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl"
                style={{ backgroundColor: "#ffffff" }}
              >
                <div className="text-4xl mb-4">⏰</div>
                <p className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>
                  Período de prueba vencido
                </p>
                <p className="text-sm mb-5" style={{ color: "#64748b" }}>
                  Para continuar usando el sistema adquiere una suscripción.
                </p>
                <a
                  href="mailto:soporte@clinicaportal.com?subject=Activar suscripción"
                  className="inline-block text-sm font-semibold px-5 py-2.5 rounded-xl"
                  style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
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
