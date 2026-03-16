"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function NewUserPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "receptionist",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await api.post("/api/v1/auth/sign_up_staff", { user: form });
      toast.success("Usuario creado correctamente");
      router.push("/dashboard/users");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.error || "Error al crear usuario");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <button
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
            }}
          >
            ← Volver
          </button>
        </Link>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Nuevo usuario
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Crea un nuevo usuario para la clínica
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          }}
        >
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-5">
          {/* Datos personales */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Datos personales
            </p>

            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                placeholder="María"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Apellido *</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                placeholder="López"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="55551234"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Acceso */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Acceso al sistema
            </p>

            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="usuario@clinica.com"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Rol *</label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                style={inputStyle}
                required
              >
                <option value="receptionist">Recepcionista</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrador</option>
              </select>
              {form.role === "doctor" && (
                <p className="text-xs mt-1" style={{ color: "#f59e0b" }}>
                  ⚠️ Para doctores usa el módulo de Doctores para configurar
                  horarios y especialidad.
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Contraseña temporal *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => {
                  handleChange("password", e.target.value);
                  handleChange("password_confirmation", e.target.value);
                }}
                style={inputStyle}
                required
              />
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                El usuario podrá cambiarla desde su perfil
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-5">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: loading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
          <Link href="/dashboard/users">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #e2e8f0",
              }}
            >
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
