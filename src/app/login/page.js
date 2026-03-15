"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({ slug: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.slug, form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo */}
      <div
        className="hidden lg:flex flex-col justify-between p-12"
        style={{ backgroundColor: "#18181b" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">C</span>
          </div>
          <span className="text-white font-semibold text-sm">
            Clínica Portal
          </span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestión de citas médicas profesional
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Administra doctores, pacientes y citas desde un solo lugar. Rápido,
            seguro y multitenant.
          </p>
          <div className="space-y-4 pt-4">
            {[
              {
                title: "Agenda inteligente",
                desc: "Disponibilidad en tiempo real sin conflictos",
              },
              {
                title: "Multitenant",
                desc: "Una plataforma para todas tus clínicas",
              },
              {
                title: "Notificaciones",
                desc: "Emails automáticos de confirmación",
              },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{f.title}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-zinc-600 text-xs">
          2026 Clínica Portal. Todos los derechos reservados.
        </p>
      </div>

      {/* Panel derecho */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">
                C
              </span>
            </div>
            <span className="font-semibold text-sm">Clínica Portal</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingresa los datos de tu clínica para continuar
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Identificador de clínica
              </label>
              <input
                name="slug"
                type="text"
                value={form.slug}
                onChange={handleChange}
                placeholder="clinica-veterinaria-patitas"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
              <p className="text-xs text-muted-foreground">
                El slug único de tu organización
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@clinica.com"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center w-full h-9 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
            <div className="text-center mt-4">
              <Link href="/forgot-password">
                <span
                  className="text-sm"
                  style={{ color: "#2563eb", cursor: "pointer" }}
                >
                  ¿Olvidaste tu contraseña?
                </span>
              </Link>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            No tienes cuenta?{" "}
            <a
              href="/register"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Registra tu clínica
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
