"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", slug: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/auth/forgot_password", form);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al enviar el email");
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

  if (sent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f5f9" }}
      >
        <div className="w-full max-w-md">
          <div
            className="rounded-xl p-8 shadow-sm text-center"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#f0fdf4" }}
            >
              <span className="text-2xl">✉️</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#0f172a" }}>
              Revisa tu email
            </h2>
            <p className="text-sm mb-6" style={{ color: "#64748b" }}>
              Si el email existe recibirás instrucciones para restablecer tu
              contraseña en los próximos minutos.
            </p>
            <Link href="/login">
              <button
                className="w-full py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              >
                Volver al login
              </button>
            </Link>
          </div>
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
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Ingresa tu email y el slug de tu clínica
          </p>
        </div>

        <div
          className="rounded-xl p-8 shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={labelStyle}>Slug de la clínica *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="clinica-veterinaria-patitas"
                style={inputStyle}
                required
              />
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                El slug es el identificador único de tu clínica
              </p>
            </div>

            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="admin@clinica.com"
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
              {loading ? "Enviando..." : "Enviar instrucciones"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <span
                className="text-sm"
                style={{ color: "#2563eb", cursor: "pointer" }}
              >
                ← Volver al login
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
