"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const navigation = [
  { name: "Dashboard",       href: "/superadmin",               icon: "⊞" },
  { name: "Organizaciones",  href: "/superadmin/organizations",  icon: "🏥" },
  { name: "Planes",          href: "/superadmin/plans",          icon: "◈" },
  { name: "Administradores", href: "/superadmin/users",          icon: "🛡️" },
];

export default function SuperadminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/superadmin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (!loading && !user) {
      router.push("/superadmin/login");
      return;
    }
    if (!loading && user && user.role !== "superadmin") {
      router.push("/dashboard");
    }
  }, [user, loading, isLoginPage]);

  // La página de login no necesita sidebar ni auth check
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0f172a" }}>
      {/* Sidebar oscuro */}
      <aside
        className="w-60 fixed h-full flex flex-col"
        style={{ backgroundColor: "#1e293b", borderRight: "1px solid #334155" }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid #334155" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#2563eb" }}
            >
              <span className="text-white text-xs font-bold">SA</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
                Backoffice
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Super Admin
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest px-3 mb-3" style={{ color: "#475569" }}>
            Administración
          </p>
          {navigation.map((item) => {
            const isActive =
              item.href === "/superadmin"
                ? pathname === "/superadmin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "#1d4ed8" : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                }}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid #334155" }}>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-lg mb-2"
            style={{ backgroundColor: "#0f172a" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#2563eb" }}
            >
              <span className="text-white text-xs font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "#f1f5f9" }}>
                {user?.full_name}
              </p>
              <p className="text-xs" style={{ color: "#475569" }}>
                Super Admin
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 flex flex-col min-h-screen" style={{ backgroundColor: "#0f172a" }}>
        <header
          className="px-8 py-4 flex items-center justify-between"
          style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}
        >
          <p className="text-sm" style={{ color: "#475569" }}>
            {new Date().toLocaleDateString("es-GT", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: "#1d4ed8", color: "#ffffff" }}
          >
            Super Admin
          </span>
        </header>
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
