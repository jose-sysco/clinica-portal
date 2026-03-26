"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";
// Slug fijo de la organización interna del sistema — nunca expuesto al usuario
const SUPERADMIN_SLUG = "sistema-superadmin";

export default function SuperadminLoginPage() {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/v1/auth/sign_in`,
        { user: { email: form.email, password: form.password } },
        { headers: { "X-Organization-Slug": SUPERADMIN_SLUG, "Content-Type": "application/json" } }
      );

      const { token, refresh_token, user } = res.data;

      if (user?.role !== "superadmin") {
        setError("Esta cuenta no tiene permisos de administrador del sistema.");
        return;
      }

      // Guardamos token, refresh y slug fijo del superadmin.
      // El slug es necesario para que AuthContext.fetchMe() pueda llamar /api/v1/me.
      Cookies.set("token",             token,         { expires: 1 / 24 });
      Cookies.set("refresh_token",     refresh_token, { expires: 30 });
      Cookies.set("organization_slug", SUPERADMIN_SLUG, { expires: 30 });

      // Recarga completa para que AuthContext re-inicialice con el token ya guardado
      window.location.href = "/superadmin";
    } catch (err) {
      const msg = err.response?.data?.error;
      if (msg === "Organización no encontrada") {
        setError("Error de configuración del sistema. Contacta al equipo técnico.");
      } else {
        setError(msg || "Email o contraseña incorrectos");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: "#0f172a" }}>

      {/* Decorative radial blobs */}
      <div style={{ position: "absolute", top: "-120px", right: "-120px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.18), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-100px", left: "-100px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)", pointerEvents: "none" }} />

      <div className="w-full max-w-sm relative z-10 px-4">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>Backoffice</h1>
          <p className="text-sm mt-1.5" style={{ color: "#475569" }}>Acceso exclusivo para administradores del sistema</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", boxShadow: "0 24px 48px rgba(0,0,0,0.4)" }}>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm mb-5"
              style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
            >
              <span className="flex-shrink-0">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { name: "email",    label: "Correo electrónico", type: "email",    placeholder: "admin@sistema.com", autoComplete: "email" },
              { name: "password", label: "Contraseña",         type: "password", placeholder: "••••••••",          autoComplete: "current-password" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "#64748b" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  required
                  autoComplete={field.autoComplete}
                  value={form[field.name]}
                  onChange={e => setForm(f => ({ ...f, [field.name]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full text-sm px-4 rounded-xl outline-none transition-all"
                  style={{
                    height:          "48px",
                    backgroundColor: "#0f172a",
                    border:          "1.5px solid #334155",
                    color:           "#f1f5f9",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.boxShadow   = "0 0 0 3px rgba(37,99,235,0.2)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "#334155";
                    e.target.style.boxShadow   = "none";
                  }}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-bold rounded-xl transition-all"
              style={{
                height:     "48px",
                background: loading ? "#1e3a8a" : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                color:      "#ffffff",
                border:     "none",
                boxShadow:  loading ? "none" : "0 4px 16px rgba(37,99,235,0.4)",
                cursor:     loading ? "not-allowed" : "pointer",
                marginTop:  "8px",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = "0 6px 22px rgba(37,99,235,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 16px rgba(37,99,235,0.4)"; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Accediendo…
                </span>
              ) : (
                "Acceder al sistema →"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#334155" }}>
          ¿Usuario de una clínica?{" "}
          <a href="/login" style={{ color: "#475569", textDecoration: "underline" }}>
            Ir al portal de clínicas
          </a>
        </p>

        <p className="text-center text-xs mt-3" style={{ color: "#1e293b" }}>
          Clínica Portal · Sistema interno
        </p>
      </div>
    </div>
  );
}
