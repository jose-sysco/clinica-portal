"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function NewOwnerPage() {
  const router = useRouter();
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    identification: "",
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
      await api.post("/api/v1/owners", { owner: form });
      toast.success(`${config.ownerLabel} creado correctamente`);
      router.push("/dashboard/owners");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(
          err.response?.data?.error ||
            `Error al crear ${config.ownerLabel.toLowerCase()}`,
        );
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
        <Link href="/dashboard/owners">
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
            Nuevo {config.ownerLabel.toLowerCase()}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Registra un nuevo {config.ownerLabel.toLowerCase()} en el sistema
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Columna izquierda */}
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
                placeholder="Juan"
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
                placeholder="Pérez"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Teléfono *</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="55551234"
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Columna derecha */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Datos adicionales
            </p>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="juan@email.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Identificación</label>
              <input
                type="text"
                value={form.identification}
                onChange={(e) => handleChange("identification", e.target.value)}
                placeholder="1234567"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Dirección</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Ciudad de Guatemala"
                style={inputStyle}
              />
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
            {loading
              ? "Creando..."
              : `Crear ${config.ownerLabel.toLowerCase()}`}
          </button>
          <Link href="/dashboard/owners">
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
