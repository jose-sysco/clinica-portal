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

const CLINIC_TYPE_ICONS = {
  veterinary:    "🐾",
  pediatric:     "👶",
  general:       "🏥",
  dental:        "🦷",
  psychology:    "🧠",
  physiotherapy: "💪",
  nutrition:     "🥗",
  beauty:        "✨",
  coaching:      "🎯",
  legal:         "⚖️",
  fitness:       "🏋️",
};

function InputField({ label, name, type, value, onChange, placeholder, disabled, autoFocus }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2 text-foreground/80">
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
        className="w-full text-sm px-4 h-12 rounded-xl outline-none transition-all
                   bg-card border-[1.5px] border-border text-foreground placeholder:text-muted-foreground
                   shadow-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                   disabled:bg-muted/50 disabled:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300">
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
      className={`w-full text-sm font-bold rounded-xl h-12 text-white transition-all
                  ${loading
                    ? "bg-blue-300 dark:bg-blue-800 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 shadow-lg shadow-blue-600/35 hover:shadow-blue-600/45"}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          {loadingLabel}
        </span>
      ) : label}
    </button>
  );
}

function LeftPanel() {
  // Panel de marketing — siempre oscuro por diseño (el gradient es la marca)
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none bg-[radial-gradient(circle,#60a5fa,transparent)] translate-x-[30%] -translate-y-[30%]" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 pointer-events-none bg-[radial-gradient(circle,#818cf8,transparent)] -translate-x-[30%] translate-y-[30%]" />

      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 border border-white/25">
          <span className="text-white font-black text-base">C</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight">Agendia</span>
      </div>

      <div className="space-y-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 bg-white/10 text-white/70 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full inline-block bg-emerald-400" />
            Sistema activo — Guatemala
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Gestión de citas
            <br />
            <span className="text-blue-300">sin complicaciones</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/55">
            Administra citas, clientes y profesionales desde un solo portal.
            Rápido, seguro y adaptable a cualquier negocio.
          </p>
        </div>

        <div className="space-y-4">
          {MARKETING.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-white/10 border border-white/15">
                {f.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-xs mt-0.5 leading-relaxed text-white/50">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs relative z-10 text-white/30">
        © {new Date().getFullYear()} Agendia · Todos los derechos reservados
      </p>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

function LoginForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const { login }   = useAuth();

  const justRegistered = searchParams.get("registered") === "true";

  const [step,           setStep]           = useState("email");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [org,            setOrg]            = useState(null);
  const [allOrgs,        setAllOrgs]        = useState([]);
  const [error,          setError]          = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [resendLoading,  setResendLoading]  = useState(false);
  const [resendDone,     setResendDone]     = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await api.get("/api/v1/lookup", { params: { email } });
      const orgs = res.data.organizations ?? [];

      if (orgs.length === 0) {
        setError("No encontramos una cuenta con ese correo.");
        return;
      }

      setAllOrgs(orgs);

      if (orgs.length === 1) {
        setOrg(orgs[0]);
        setStep("password");
      } else {
        setStep("org_picker");
      }
    } catch (err) {
      const msg = err.response?.data?.error;
      setError(msg || "No pudimos encontrar tu cuenta. Verifica el correo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = (selectedOrg) => {
    setOrg(selectedOrg);
    setStep("password");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setUnverifiedEmail(null);
    setResendDone(false);
    setLoading(true);
    try {
      const data = await login(org.slug, email, password);
      if (allOrgs.length > 1) {
        localStorage.setItem("accessible_orgs", JSON.stringify(allOrgs));
      } else {
        localStorage.removeItem("accessible_orgs");
      }
      router.push(data.user?.role === "superadmin" ? "/superadmin" : "/dashboard");
    } catch (err) {
      if (err.response?.data?.code === "email_not_verified") {
        setUnverifiedEmail(email);
      } else {
        setError(err.response?.data?.error || "Contraseña incorrecta. Intenta de nuevo.");
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

  const goBackToEmail = () => {
    setStep("email");
    setPassword("");
    setOrg(null);
    setAllOrgs([]);
    setError(null);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <LeftPanel />

      <div className="flex flex-col items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600">
              <span className="text-white font-black">C</span>
            </div>
            <span className="font-bold text-base text-foreground">Agendia</span>
          </div>

          {/* ── Paso 1: email ────────────────────────────────────────── */}
          {step === "email" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Bienvenido de vuelta</h2>
                <p className="text-sm mt-1.5 text-muted-foreground">Ingresa tu correo para continuar</p>
              </div>

              {justRegistered && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5 text-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300">
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
                <SubmitButton loading={loading} label="Continuar →" loadingLabel="Buscando..." />
              </form>

              <p className="text-center text-sm mt-6 text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Registra tu negocio
                </Link>
              </p>

              <p className="text-center text-sm mt-3 text-muted-foreground">
                ¿Eres paciente?{" "}
                <Link href="/reservas" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Reservar cita en línea
                </Link>
              </p>
            </>
          )}

          {/* ── Paso 1b: selector de organización (multi-org) ────────── */}
          {step === "org_picker" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Selecciona tu organización</h2>
                <p className="text-sm mt-1.5 text-muted-foreground">
                  Tu cuenta tiene acceso a {allOrgs.length} organizaciones
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {allOrgs.map((o) => (
                  <button
                    key={o.slug}
                    type="button"
                    onClick={() => handleSelectOrg(o)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-left bg-card border-[1.5px] border-border shadow-sm hover:border-blue-500 hover:ring-2 hover:ring-blue-500/15 transition-all"
                  >
                    {o.logo_url ? (
                      <img src={o.logo_url} alt={o.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                        {CLINIC_TYPE_ICONS[o.clinic_type] || "🏥"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground">{o.name}</p>
                      <p className="text-xs mt-0.5 capitalize text-muted-foreground">{o.plan}</p>
                    </div>
                    <span className="text-base text-muted-foreground">→</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={goBackToEmail}
                className="w-full text-sm font-medium py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Usar otro correo
              </button>
            </>
          )}

          {/* ── Paso 2: contraseña ───────────────────────────────────── */}
          {step === "password" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Ingresa tu contraseña</h2>
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                  {org?.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="w-4 h-4 rounded object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full inline-block bg-blue-600 dark:bg-blue-400" />
                  )}
                  {org?.name}
                </div>
              </div>

              <ErrorBox msg={error} />

              {unverifiedEmail && (
                <div className="rounded-xl p-4 mb-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                  <p className="text-sm font-semibold mb-2 text-amber-800 dark:text-amber-200">⚠️ Correo no verificado</p>
                  <p className="text-sm mb-3 text-amber-800 dark:text-amber-200">
                    Debes verificar tu correo antes de iniciar sesión.
                  </p>
                  {!resendDone ? (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className={`text-sm font-semibold rounded-lg px-4 py-2 text-white transition-colors
                                  ${resendLoading
                                    ? "bg-amber-300 dark:bg-amber-700 cursor-not-allowed"
                                    : "bg-amber-500 hover:bg-amber-600"}`}
                    >
                      {resendLoading ? "Enviando..." : "Reenviar correo de verificación"}
                    </button>
                  ) : (
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ Correo reenviado. Revisa tu bandeja de entrada.
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <InputField label="Correo electrónico" name="email" type="email" value={email} disabled />

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
                  <Link href="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <SubmitButton loading={loading} label="Iniciar sesión →" loadingLabel="Iniciando sesión..." />

                <button
                  type="button"
                  onClick={() => {
                    if (allOrgs.length > 1) {
                      setStep("org_picker");
                      setPassword("");
                      setError(null);
                    } else {
                      goBackToEmail();
                    }
                  }}
                  className="w-full text-sm font-medium py-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                >
                  {allOrgs.length > 1 ? "← Cambiar organización" : "← Usar otro correo"}
                </button>
              </form>
            </>
          )}

          <p className="text-xs text-center mt-6 text-muted-foreground">
            ¿Necesitas ayuda?{" "}
            <a href="/manual-usuario.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
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
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
