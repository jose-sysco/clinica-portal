"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const features = [
  { icon: "📅", title: "Agenda inteligente",   desc: "Disponibilidad en tiempo real sin conflictos de horario" },
  { icon: "🔔", title: "Notificaciones",        desc: "Recordatorios automáticos por email a tus pacientes" },
  { icon: "📋", title: "Expedientes digitales", desc: "Historial clínico completo en un solo lugar" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form,    setForm]    = useState({ slug: "", email: "", password: "" });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(form.slug, form.email, form.password);
      router.push(data.user?.role === "superadmin" ? "/superadmin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Panel izquierdo ────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}
      >
        {/* Círculos decorativos de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#60a5fa,transparent)", transform: "translate(30%,-30%)" }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#818cf8,transparent)", transform: "translate(-30%,30%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <span className="text-white font-black text-base">C</span>
          </div>
          <span className="text-white font-bold text-base tracking-tight">Clínica Portal</span>
        </div>

        {/* Copy */}
        <div className="space-y-8 relative z-10">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#4ade80" }} />
              Sistema activo — Guatemala
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Gestión médica<br />
              <span style={{ color: "#93c5fd" }}>sin complicaciones</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
              Administra citas, pacientes y doctores desde un solo portal. Rápido, seguro y adaptable a cualquier clínica.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: "rgba(255,255,255,0.25)" }}>
          © 2026 Clínica Portal · Todos los derechos reservados
        </p>
      </div>

      {/* ── Panel derecho (form) ────────────────────────────────────── */}
      <div className="flex items-center justify-center p-8" style={{ backgroundColor: "#f8fafc" }}>
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}
            >
              <span className="text-white font-black">C</span>
            </div>
            <span className="font-bold text-base" style={{ color: "#0f172a" }}>Clínica Portal</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight" style={{ color: "#0f172a" }}>
              Bienvenido de vuelta
            </h2>
            <p className="text-sm mt-1.5" style={{ color: "#64748b" }}>
              Ingresa los datos de tu clínica para continuar
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
            >
              <span className="flex-shrink-0">⚠</span>
              {error}
            </div>
          )}

          {/* Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { name: "slug",     label: "Identificador de clínica", type: "text",     placeholder: "clinica-veterinaria-patitas", hint: "El slug único de tu organización" },
              { name: "email",    label: "Correo electrónico",       type: "email",    placeholder: "admin@clinica.com"            },
              { name: "password", label: "Contraseña",               type: "password", placeholder: "••••••••"                    },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#374151" }}>
                  {field.label}
                </label>
                <input
                  name={field.name}
                  type={field.type}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required
                  className="w-full text-sm px-4 rounded-xl outline-none transition-all"
                  style={{
                    height:          "48px",
                    backgroundColor: "#ffffff",
                    border:          "1.5px solid #e2e8f0",
                    color:           "#0f172a",
                    boxShadow:       "0 1px 3px rgba(15,23,42,0.05)",
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
                {field.hint && (
                  <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>{field.hint}</p>
                )}
              </div>
            ))}

            <div className="flex justify-end -mt-2">
              <Link href="/forgot-password" className="text-sm font-medium" style={{ color: "#2563eb" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-bold rounded-xl transition-all"
              style={{
                height:    "48px",
                background: loading ? "#93c5fd" : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                color:     "#ffffff",
                border:    "none",
                boxShadow: loading ? "none" : "0 4px 16px rgba(37,99,235,0.35)",
                cursor:    loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.boxShadow = "0 6px 22px rgba(37,99,235,0.45)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 16px rgba(37,99,235,0.35)";
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar sesión →"
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#94a3b8" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "#2563eb" }}>
              Registra tu clínica
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
