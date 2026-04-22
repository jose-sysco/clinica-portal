"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import superadminApi from "@/lib/superadminApi";

const navigation = [
  { name: "Dashboard",       href: "/superadmin" },
  { name: "Organizaciones",  href: "/superadmin/organizations" },
  { name: "Facturación",     href: "/superadmin/billing" },
  { name: "Planes",          href: "/superadmin/plans" },
  { name: "Administradores", href: "/superadmin/users" },
];

const planColor = {
  trial:        "#f59e0b",
  basic:        "#3b82f6",
  professional: "#8b5cf6",
  enterprise:   "#06b6d4",
};
const planLabel = {
  trial: "Trial", basic: "Básico", professional: "Profesional", enterprise: "Empresarial",
};
const statusColor = {
  active: "#22c55e", suspended: "#ef4444", inactive: "#94a3b8",
};

// ─── GlobalSearch ─────────────────────────────────────────────────────────────
function GlobalSearch() {
  const router   = useRouter();
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [active,  setActive]  = useState(-1);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const abortRef  = useRef(null);
  const timerRef  = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const r = await superadminApi.get("/api/superadmin/organizations", {
        params: { q, limit: 8 },
        signal: abortRef.current.signal,
      });
      setResults(r.data.data?.slice(0, 8) || []);
      setOpen(true);
      setActive(-1);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(() => search(q), 280);
  };

  const goTo = (org) => {
    router.push(`/superadmin/organizations/${org.id}`);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    if (e.key === "Enter" && active >= 0) { e.preventDefault(); goTo(results[active]); }
    if (e.key === "Escape") { setOpen(false); setQuery(""); inputRef.current?.blur(); }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative" style={{ width: "320px" }}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ color: "#475569", flexShrink: 0 }}>
          <path d="M17.5 17.5l-4.167-4.167M14.167 8.333a5.833 5.833 0 11-11.667 0 5.833 5.833 0 0111.667 0z"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
          placeholder="Buscar organización..."
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: "#f1f5f9" }}
        />
        {loading ? (
          <div className="w-3.5 h-3.5 border border-blue-500 border-t-transparent rounded-full animate-spin" style={{ flexShrink: 0 }} />
        ) : (
          <span className="text-xs px-1.5 py-0.5 rounded font-mono"
            style={{ backgroundColor: "#1e293b", color: "#475569", border: "1px solid #334155", flexShrink: 0 }}>
            ⌘K
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full rounded-xl overflow-hidden z-50 shadow-2xl"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          {results.map((org, i) => (
            <button
              key={org.id}
              onClick={() => goTo(org)}
              onMouseEnter={() => setActive(i)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ backgroundColor: active === i ? "#334155" : "transparent",
                       borderBottom: i < results.length - 1 ? "1px solid #0f172a" : "none" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: `${planColor[org.plan] || "#64748b"}22`,
                         color: planColor[org.plan] || "#64748b",
                         border: `1px solid ${planColor[org.plan] || "#64748b"}33` }}
              >
                {org.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: "#f1f5f9" }}>{org.name}</p>
                <p className="text-xs truncate" style={{ color: "#475569" }}>{org.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-medium" style={{ color: planColor[org.plan] || "#64748b" }}>
                  {planLabel[org.plan] || org.plan}
                </span>
                <span className="text-xs" style={{ color: statusColor[org.status] || "#94a3b8" }}>
                  {org.status === "active" ? "Activa" : org.status === "suspended" ? "Suspendida" : "Inactiva"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && !loading && (
        <div className="absolute top-full mt-1 w-full rounded-xl px-4 py-3 z-50 shadow-2xl"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-sm" style={{ color: "#475569" }}>Sin resultados para "{query}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function SuperadminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/superadmin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (!loading && !user) { router.push("/superadmin/login"); return; }
    if (!loading && user && user.role !== "superadmin") router.push("/dashboard");
  }, [user, loading, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0f172a" }}>
      {/* Sidebar */}
      <aside className="w-56 fixed h-full flex flex-col"
        style={{ backgroundColor: "#1e293b", borderRight: "1px solid #334155" }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid #334155" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#2563eb" }}>
              <span className="text-white text-xs font-bold">SA</span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Backoffice</p>
              <p className="text-xs" style={{ color: "#64748b" }}>Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navigation.map((item) => {
            const isActive = item.href === "/superadmin"
              ? pathname === "/superadmin"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "#2563eb" : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                }}>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid #334155" }}>
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg mb-2"
            style={{ backgroundColor: "#0f172a" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#2563eb" }}>
              <span className="text-white text-xs font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "#f1f5f9" }}>{user?.full_name}</p>
              <p className="text-xs" style={{ color: "#475569" }}>Super Admin</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full text-left text-sm px-3 py-2 rounded-lg transition-colors"
            style={{ color: "#64748b" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.backgroundColor = "transparent"; }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 flex flex-col min-h-screen" style={{ backgroundColor: "#0f172a" }}>
        <header className="px-8 py-3 flex items-center justify-between sticky top-0 z-40"
          style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
          <GlobalSearch />
          <p className="text-xs" style={{ color: "#475569" }}>
            {new Date().toLocaleDateString("es-GT", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </header>
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
