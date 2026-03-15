"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const getNavigation = (clinicType) => {
  const base = [
    { name: "Dashboard", href: "/dashboard", icon: "⊞" },
    { name: "Citas", href: "/dashboard/appointments", icon: "◷" },
    { name: "Doctores", href: "/dashboard/doctors", icon: "✚" },
    { name: "Pacientes", href: "/dashboard/patients", icon: "♡" },
  ];

  if (clinicType === "veterinary" || clinicType === "pediatric") {
    base.push({
      name: "Propietarios / Tutores",
      href: "/dashboard/owners",
      icon: "◎",
    });
  }

  return base;
};

const clinicTypeLabel = {
  veterinary: "Veterinaria",
  pediatric: "Pediatría",
  general: "Medicina General",
  dental: "Odontología",
};

const roleLabel = {
  admin: "Administrador",
  doctor: "Doctor",
  receptionist: "Recepcionista",
  patient: "Paciente",
};

export default function DashboardLayout({ children }) {
  const { user, organization, logout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading]);

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
  const navigation = getNavigation(organization?.clinic_type);

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
            const isActive = pathname === item.href;
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
        </header>

        {/* Content */}
        <div className="flex-1 p-8" style={{ backgroundColor: "#f1f5f9" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
