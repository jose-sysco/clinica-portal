"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const slug = searchParams.get("slug");

  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/v1/auth/reset_password", {
        token: token,
        slug: slug,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0] || "Token inválido o expirado",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  };

  if (!token || !slug) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f5f9" }}
      >
        <div
          className="rounded-xl p-8 shadow-sm text-center max-w-md w-full"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-sm font-medium mb-4" style={{ color: "#dc2626" }}>
            Enlace inválido o expirado
          </p>
          <Link href="/forgot-password">
            <button
              className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            >
              Solicitar nuevo enlace
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f5f9" }}
      >
        <div
          className="rounded-xl p-8 shadow-sm text-center max-w-md w-full"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#f0fdf4" }}
          >
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>
            ¡Contraseña restablecida!
          </h2>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Serás redirigido al login en unos segundos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#f1f5f9" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#2563eb" }}
          >
            <span className="text-white font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>
            Nueva contraseña
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Ingresa tu nueva contraseña
          </p>
        </div>

        <div
          className="rounded-xl p-8 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={labelStyle}>Nueva contraseña *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Confirmar contraseña *</label>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    password_confirmation: e.target.value,
                  }))
                }
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium mt-2"
              style={{
                backgroundColor: loading ? "#93c5fd" : "#2563eb",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Restableciendo..." : "Restablecer contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
