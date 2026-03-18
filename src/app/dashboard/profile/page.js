"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, fetchMe } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((f) => ({ ...f, [field]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await api.patch("/api/v1/me", { user: form });
      await fetchMe();
      toast.success("Perfil actualizado correctamente");
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0] || "Error al actualizar perfil",
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoadingPassword(true);
    try {
      await api.patch("/api/v1/me/change_password", passwordForm);
      toast.success("Contraseña actualizada correctamente");
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar contraseña");
    } finally {
      setLoadingPassword(false);
    }
  };

  const roleLabel = {
    admin: "Administrador",
    doctor: "Doctor",
    receptionist: "Recepcionista",
    patient: "Paciente",
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
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#0f172a" }}
        >
          Mi perfil
        </h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Administra tu información personal
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Datos personales */}
        <div className="space-y-5">
          {/* Avatar y rol */}
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#2563eb" }}
              >
                <span className="text-white text-xl font-bold">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: "#0f172a" }}>
                  {user?.full_name}
                </p>
                <p className="text-sm" style={{ color: "#64748b" }}>
                  {user?.email}
                </p>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full mt-1 inline-block"
                  style={{
                    color: "#2563eb",
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {roleLabel[user?.role]}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de perfil */}
          <form onSubmit={handleProfileSubmit}>
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
                Datos personales
              </p>

              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Apellido</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
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
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={user?.email}
                  style={{
                    ...inputStyle,
                    backgroundColor: "#f8fafc",
                    color: "#94a3b8",
                  }}
                  disabled
                />
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  El email no puede modificarse
                </p>
              </div>

              <button
                type="submit"
                disabled={loadingProfile}
                className="w-full py-2.5 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: loadingProfile ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  cursor: loadingProfile ? "not-allowed" : "pointer",
                }}
              >
                {loadingProfile ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>

        {/* Cambio de contraseña */}
        <form onSubmit={handlePasswordSubmit}>
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Cambiar contraseña
            </p>

            <div>
              <label style={labelStyle}>Contraseña actual *</label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  handlePasswordChange("current_password", e.target.value)
                }
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Nueva contraseña *</label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) =>
                  handlePasswordChange("password", e.target.value)
                }
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Confirmar nueva contraseña *</label>
              <input
                type="password"
                value={passwordForm.password_confirmation}
                onChange={(e) =>
                  handlePasswordChange("password_confirmation", e.target.value)
                }
                placeholder="••••••••"
                style={inputStyle}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingPassword}
              className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: loadingPassword ? "#93c5fd" : "#0f172a",
                color: "#ffffff",
                cursor: loadingPassword ? "not-allowed" : "pointer",
              }}
            >
              {loadingPassword ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
