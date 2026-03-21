"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          500
        </p>

        {/* Ícono */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="#ea580c"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1
          className="text-2xl font-black tracking-tight mb-2"
          style={{ color: "#0f172a" }}
        >
          Algo salió mal
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "#64748b" }}>
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: "#ffffff",
              color: "#374151",
              border: "1.5px solid #e2e8f0",
            }}
          >
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
