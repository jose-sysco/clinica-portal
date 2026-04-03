"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import Link from "next/link";

const MARKETING = [
  {
    icon: "📅",
    title: "Agenda inteligente",
    desc: "Disponibilidad en tiempo real sin conflictos de horario",
  },
  {
    icon: "🔔",
    title: "Notificaciones",
    desc: "Recordatorios automáticos por email a tus pacientes",
  },
  {
    icon: "📋",
    title: "Expedientes digitales",
    desc: "Historial clínico completo en un solo lugar",
  },
];

// Estilos de input reutilizables
const inputStyle = {
  height: "48px",
  backgroundColor: "#ffffff",
  border: "1.5px solid #e2e8f0",
  color: "#0f172a",
  boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
};

function InputField({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  autoFocus,
}) {
  return (
    <div>
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: "#374151" }}
      >
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        required
        className="w-full text-sm px-4 rounded-xl outline-none transition-all"
        style={{
          ...inputStyle,
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          color: disabled ? "#94a3b8" : "#0f172a",
          cursor: disabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = "#2563eb";
            e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "0 1px 3px rgba(15,23,42,0.05)";
        }}
      />
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm"
      style={{
        backgroundColor: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#dc2626",
      }}
    >
      <span className="flex-shrink-0">⚠</span>
      {msg}
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full text-sm font-bold rounded-xl transition-all"
      style={{
        height: "48px",
        background: loading
          ? "#93c5fd"
          : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
        color: "#ffffff",
        border: "none",
        boxShadow: loading ? "none" : "0 4px 16px rgba(37,99,235,0.35)",
        cursor: loading ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!loading)
          e.currentTarget.style.boxShadow = "0 6px 22px rgba(37,99,235,0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = loading
          ? "none"
          : "0 4px 16px rgba(37,99,235,0.35)";
      }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          {loadingLabel}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

// ── Panel de marketing (izquierda) ────────────────────────────────────────────

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)",
      }}
    >
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle,#60a5fa,transparent)",
          transform: "translate(30%,-30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle,#818cf8,transparent)",
          transform: "translate(-30%,30%)",
        }}
      />

      <div className="flex items-center gap-3 relative z-10">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <span className="text-white font-black text-base">C</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight">
          Agendia
        </span>
      </div>

      <div className="space-y-8 relative z-10">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: "#4ade80" }}
            />
            Sistema activo — Guatemala
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Gestión de citas
            <br />
            <span style={{ color: "#93c5fd" }}>sin complicaciones</span>
          </h1>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: "rgba(255,255,255,0.52)" }}
          >
            Administra citas, clientes y profesionales desde un solo portal.
            Rápido, seguro y adaptable a cualquier negocio.
          </p>
        </div>

        <div className="space-y-4">
          {MARKETING.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{
                  backgroundColor: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                {f.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p
                  className="text-xs mt-0.5 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.48)" }}
                >
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p
        className="text-xs relative z-10"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        © {new Date().getFullYear()} Agendia · Todos los derechos reservados
      </p>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const justRegistered = searchParams.get("registered") === "true";

  // step: "email" | "password"
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [org, setOrg] = useState(null); // { slug, name }
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  // ── Paso 1: buscar organización por email ─────────────────────────────────

  const handleLookup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/lookup", { params: { email } });
      setOrg(res.data);
      setStep("password");
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(msg || "No pudimos encontrar tu cuenta. Verifica el correo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: iniciar sesión ────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setResendDone(false);
    setLoading(true);
    try {
      const data = await login(org.slug, email, password);
      router.push(
        data.user?.role === "superadmin" ? "/superadmin" : "/dashboard",
      );
    } catch (err) {
      if (err.response?.data?.code === "email_not_verified") {
        setUnverifiedEmail(email);
      } else {
        setError(
          err.response?.data?.error ||
            "Contraseña incorrecta. Intenta de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post("/api/v1/auth/resend_verification", {
        email: unverifiedEmail,
        organization_slug: org?.slug,
      });
      setResendDone(true);
    } finally {
      setResendLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <LeftPanel />

      {/* Panel derecho */}
      <div
        className="flex flex-col items-center justify-center p-8"
        style={{ backgroundColor: "#f8fafc" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}
            >
              <span className="text-white font-black">C</span>
            </div>
            <span className="font-bold text-base" style={{ color: "#0f172a" }}>
              Agendia
            </span>
          </div>

          {/* ── Paso 1: email ────────────────────────────────────────── */}
          {step === "email" && (
            <>
              <div className="mb-8">
                <h2
                  className="text-2xl font-black tracking-tight"
                  style={{ color: "#0f172a" }}
                >
                  Bienvenido de vuelta
                </h2>
                <p className="text-sm mt-1.5" style={{ color: "#64748b" }}>
                  Ingresa tu correo para continuar
                </p>
              </div>

              {justRegistered && (
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm"
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#16a34a",
                  }}
                >
                  <span className="flex-shrink-0">✓</span>
                  Clínica registrada correctamente. Ya puedes iniciar sesión.
                </div>
              )}

              <ErrorBox msg={error} />

              <form onSubmit={handleLookup} className="space-y-5">
                <InputField
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  autoFocus
                />
                <SubmitButton
                  loading={loading}
                  label="Continuar →"
                  loadingLabel="Buscando..."
                />
              </form>

              <p
                className="text-center text-sm mt-6"
                style={{ color: "#94a3b8" }}
              >
                ¿No tienes cuenta?{" "}
                <Link
                  href="/register"
                  className="font-semibold"
                  style={{ color: "#2563eb" }}
                >
                  Registra tu negocio
                </Link>
              </p>
            </>
          )}

          {/* ── Paso 2: contraseña ───────────────────────────────────── */}
          {step === "password" && (
            <>
              <div className="mb-8">
                <h2
                  className="text-2xl font-black tracking-tight"
                  style={{ color: "#0f172a" }}
                >
                  Ingresa tu contraseña
                </h2>
                {/* Badge de organización */}
                <div
                  className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {org?.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-4 h-4 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: "#2563eb" }}
                    />
                  )}
                  {org?.name}
                </div>
              </div>

              <ErrorBox msg={error} />

              {unverifiedEmail && (
                <div
                  className="rounded-xl p-4 mb-2"
                  style={{
                    backgroundColor: "#fefce8",
                    border: "1px solid #fde68a",
                  }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#92400e", margin: "0 0 8px 0" }}
                  >
                    ⚠️ Correo no verificado
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "#92400e", margin: "0 0 12px 0" }}
                  >
                    Debes verificar tu correo antes de iniciar sesión. Revisa tu
                    bandeja de entrada.
                  </p>
                  {!resendDone ? (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="text-sm font-semibold rounded-lg px-4 py-2"
                      style={{
                        backgroundColor: resendLoading ? "#fde68a" : "#f59e0b",
                        color: "#ffffff",
                        border: "none",
                        cursor: resendLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {resendLoading
                        ? "Enviando..."
                        : "Reenviar correo de verificación"}
                    </button>
                  ) : (
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#16a34a", margin: 0 }}
                    >
                      ✓ Correo reenviado. Revisa tu bandeja de entrada.
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email bloqueado */}
                <InputField
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={email}
                  disabled
                />

                <InputField
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                />

                <div className="flex justify-end -mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium"
                    style={{ color: "#2563eb" }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <SubmitButton
                  loading={loading}
                  label="Iniciar sesión →"
                  loadingLabel="Iniciando sesión..."
                />

                {/* Volver */}
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setPassword("");
                    setError(null);
                  }}
                  className="w-full text-sm font-medium py-2 rounded-xl transition-all"
                  style={{ color: "#64748b", background: "transparent" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#1e293b")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#64748b")
                  }
                >
                  ← Usar otro correo
                </button>
              </form>
            </>
          )}
          {/* Link al manual */}
          <p className="text-xs text-center mt-6" style={{ color: "#94a3b8" }}>
            ¿Necesitas ayuda?{" "}
            <a
              href="/manual-usuario.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold"
              style={{ color: "#2563eb" }}
            >
              Ver manual de usuario
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
