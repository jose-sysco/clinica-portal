import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] p-6">
      <div className="text-center max-w-sm w-full">
        <p className="text-7xl font-black tracking-tight mb-2" style={{ color: "#e2e8f0" }}>
          404
        </p>

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <svg className="w-7 h-7" fill="none" stroke="#2563eb" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-black tracking-tight mb-2" style={{ color: "#0f172a" }}>
          Página no encontrada
        </h2>
        <p className="text-sm mb-6" style={{ color: "#64748b" }}>
          Esta sección no existe o no tienes acceso.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
          }}
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
