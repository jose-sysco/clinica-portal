"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Resolver slug desde email (igual que en el login)
      const lookup = await api.get("/api/v1/lookup", { params: { email } });
      const slug   = lookup.data.slug;

      // 2. Solicitar reset de contraseña con el slug resuelto
      await api.post("/api/v1/auth/forgot_password", { email, slug });
      setSent(true);
    } catch (err) {
      if (err.response?.status === 404) {
        // No revelar si el email existe o no (seguridad)
        setSent(true);
      } else {
        setError(err.response?.data?.error || "Error al enviar el email. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <svg className="w-8 h-8" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>Revisa tu email</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "#64748b" }}>
            Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña en los próximos minutos.
          </p>
          <Link href="/login"
            className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}>
            <span className="text-white font-black">C</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "#64748b" }}>
            Ingresa tu correo y te enviamos el enlace
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm"
            style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
            <span className="flex-shrink-0">⚠</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              autoFocus
              className="w-full text-sm px-4 rounded-xl outline-none transition-all"
              style={{
                height: "48px",
                backgroundColor: "#ffffff",
                border: "1.5px solid #e2e8f0",
                color: "#0f172a",
                boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
              }}
              onFocus={e => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.12)";
              }}
              onBlur={e => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow   = "0 1px 3px rgba(15,23,42,0.05)";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-bold rounded-xl transition-all"
            style={{
              height:     "48px",
              background: loading ? "#93c5fd" : "linear-gradient(135deg,#1d4ed8,#2563eb)",
              color:      "#ffffff",
              border:     "none",
              boxShadow:  loading ? "none" : "0 4px 16px rgba(37,99,235,0.35)",
              cursor:     loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Buscando cuenta...
              </span>
            ) : "Enviar instrucciones →"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "#94a3b8" }}>
          <Link href="/login" className="font-semibold" style={{ color: "#2563eb" }}>
            ← Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
