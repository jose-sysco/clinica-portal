"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            backgroundColor: "#f8fafc",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px", width: "100%" }}>
            <p
              style={{
                fontSize: "80px",
                fontWeight: "900",
                color: "#e2e8f0",
                lineHeight: 1,
                marginBottom: "8px",
              }}
            >
              500
            </p>

            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                backgroundColor: "#fff7ed",
                border: "1px solid #fed7aa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg width="32" height="32" fill="none" stroke="#ea580c" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <h1 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", marginBottom: "8px" }}>
              Error crítico
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "32px", lineHeight: "1.6" }}>
              La aplicación encontró un error grave. Intenta recargar la página.
            </p>

            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
              }}
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
