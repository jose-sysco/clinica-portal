"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    organization: {
      name: "",
      subdomain: "",
      email: "",
      phone: "",
      city: "",
      country: "Guatemala",
      timezone: "America/Guatemala",
      clinic_type: "veterinary",
    },
    user: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
    },
  });

  const [error, setError] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  const handleOrg = (field, value) => {
    setForm((f) => ({
      ...f,
      organization: { ...f.organization, [field]: value },
    }));
  };

  const handleUser = (field, value) => {
    setForm((f) => ({ ...f, user: { ...f.user, [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors([]);
    setLoading(true);

    if (form.user.password !== form.user.password_confirmation) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/v1/auth/sign_up", form);
      setRegisteredEmail(form.user.email);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.error || "Error al registrar");
      }
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

  if (registeredEmail) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f1f5f9" }}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-sm overflow-hidden"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <div style={{ background: "#4f46e5", padding: "32px 40px" }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              <span style={{ fontSize: "24px" }}>✉️</span>
            </div>
            <h1
              className="text-xl font-bold text-center"
              style={{ color: "#ffffff", margin: 0 }}
            >
              Revisa tu correo
            </h1>
          </div>
          <div style={{ padding: "40px" }}>
            <p
              className="text-center"
              style={{ color: "#475569", fontSize: "15px", lineHeight: "1.6" }}
            >
              Enviamos un enlace de verificación a
            </p>
            <p
              className="text-center font-semibold"
              style={{
                color: "#0f172a",
                fontSize: "15px",
                margin: "8px 0 24px",
              }}
            >
              {registeredEmail}
            </p>
            <div
              className="rounded-lg"
              style={{
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                padding: "16px",
                marginBottom: "24px",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px", color: "#0369a1" }}>
                📬 Haz clic en el enlace del correo para activar tu cuenta.
                Después podrás iniciar sesión.
              </p>
            </div>
            <Link href="/login">
              <button
                className="w-full rounded-xl font-semibold text-sm transition-all"
                style={{
                  height: "44px",
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                }}
              >
                Ir al inicio de sesión
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f1f5f9" }}>
      <div className="w-full flex items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#2563eb" }}
            >
              <span className="text-white font-bold">C</span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>
              Registra tu negocio
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              Completa los datos para empezar a usar Agendia
            </p>
          </div>

          {/* Errores */}
          {(error || errors.length > 0) && (
            <div
              className="px-4 py-3 rounded-lg mb-6 text-sm"
              style={{
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              {error && <p>{error}</p>}
              {errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Datos de la clínica */}
              <div
                className="rounded-xl p-6 shadow-sm space-y-4"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#94a3b8" }}
                >
                  Datos del negocio
                </p>

                <div>
                  <label style={labelStyle}>Nombre del negocio *</label>
                  <input
                    type="text"
                    value={form.organization.name}
                    onChange={(e) => handleOrg("name", e.target.value)}
                    placeholder="Centro Veterinario Patitas"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tipo de negocio *</label>
                  <select
                    value={form.organization.clinic_type}
                    onChange={(e) => handleOrg("clinic_type", e.target.value)}
                    style={inputStyle}
                    required
                  >
                    <optgroup label="Salud médica">
                      <option value="general">Medicina General</option>
                      <option value="pediatric">Pediatría</option>
                      <option value="dental">Odontología</option>
                      <option value="psychology">Psicología</option>
                      <option value="physiotherapy">Fisioterapia</option>
                      <option value="nutrition">Nutrición</option>
                    </optgroup>
                    <optgroup label="Bienestar y servicios">
                      <option value="beauty">Estética y Belleza</option>
                      <option value="coaching">Coaching</option>
                      <option value="fitness">Fitness y Deporte</option>
                      <option value="legal">Servicios Legales</option>
                    </optgroup>
                    <optgroup label="Veterinaria">
                      <option value="veterinary">Veterinaria</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Email de la clínica *</label>
                  <input
                    type="email"
                    value={form.organization.email}
                    onChange={(e) => handleOrg("email", e.target.value)}
                    placeholder="contacto@clinica.com"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input
                    type="text"
                    value={form.organization.phone}
                    onChange={(e) => handleOrg("phone", e.target.value)}
                    placeholder="55551234"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Ciudad</label>
                  <input
                    type="text"
                    value={form.organization.city}
                    onChange={(e) => handleOrg("city", e.target.value)}
                    placeholder="Guatemala"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>País</label>
                  <input
                    type="text"
                    value={form.organization.country}
                    onChange={(e) => handleOrg("country", e.target.value)}
                    placeholder="Guatemala"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Datos del administrador */}
              <div
                className="rounded-xl p-6 shadow-sm space-y-4"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#94a3b8" }}
                >
                  Datos del administrador
                </p>

                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input
                    type="text"
                    value={form.user.first_name}
                    onChange={(e) => handleUser("first_name", e.target.value)}
                    placeholder="Carlos"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Apellido *</label>
                  <input
                    type="text"
                    value={form.user.last_name}
                    onChange={(e) => handleUser("last_name", e.target.value)}
                    placeholder="López"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email *</label>
                  <input
                    type="email"
                    value={form.user.email}
                    onChange={(e) => handleUser("email", e.target.value)}
                    placeholder="admin@clinica.com"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input
                    type="text"
                    value={form.user.phone}
                    onChange={(e) => handleUser("phone", e.target.value)}
                    placeholder="55559999"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Contraseña *</label>
                  <input
                    type="password"
                    value={form.user.password}
                    onChange={(e) => handleUser("password", e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Confirmar contraseña *</label>
                  <input
                    type="password"
                    value={form.user.password_confirmation}
                    onChange={(e) =>
                      handleUser("password_confirmation", e.target.value)
                    }
                    placeholder="••••••••"
                    style={inputStyle}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: loading ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
              <Link href="/login">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Ya tengo cuenta
                </button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
