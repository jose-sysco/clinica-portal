"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <div className="text-center max-w-md w-full">
        {/* Código */}
        <p
          className="text-8xl font-black tracking-tight mb-2"
          style={{ color: "#e2e8f0" }}
        >
          404
        </p>

        {/* Ícono */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="#2563eb"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1
          className="text-2xl font-black tracking-tight mb-2"
          style={{ color: "#0f172a" }}
        >
          Página no encontrada
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "#64748b" }}>
          La página que buscas no existe o fue movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            }}
          >
            Ir al dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#ffffff",
              color: "#374151",
              border: "1.5px solid #e2e8f0",
            }}
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}
