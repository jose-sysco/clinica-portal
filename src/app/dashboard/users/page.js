"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const roleLabel = {
  admin: {
    label: "Administrador",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#e9d5ff",
  },
  doctor: {
    label: "Doctor",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  receptionist: {
    label: "Recepcionista",
    color: "#0891b2",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  patient: {
    label: "Paciente",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
};

const statusLabel = {
  active: {
    label: "Activo",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  inactive: {
    label: "Inactivo",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/users");
      setUsers(res.data.data);
    } catch (err) {
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (passwordForm.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch(
        `/api/v1/users/${selectedUser.id}/admin_change_password`,
        passwordForm,
      );
      toast.success(`Contraseña de ${selectedUser.first_name} actualizada`);
      setShowPasswordModal(false);
      setPasswordForm({ password: "", password_confirmation: "" });
      setSelectedUser(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cambiar contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm({ password: "", password_confirmation: "" });
    setShowPasswordModal(true);
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

  if (error) {
    return (
      <div
        className="rounded-xl p-4 text-sm"
        style={{
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Usuarios
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gestiona los usuarios de la clínica
          </p>
        </div>
        <Link href="/dashboard/users/new">
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1d4ed8")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#2563eb")
            }
          >
            + Nuevo usuario
          </button>
        </Link>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            No hay usuarios registrados
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Usuario
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Email
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Rol
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Estado
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const role = roleLabel[user.role] || roleLabel.patient;
                const status = statusLabel[user.status] || statusLabel.active;
                const isMe = user.id === currentUser?.id;
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom:
                        index < users.length - 1 ? "1px solid #f1f5f9" : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "#eff6ff" }}
                        >
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "#2563eb" }}
                          >
                            {user.first_name?.[0]}
                            {user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              className="text-sm font-medium"
                              style={{ color: "#0f172a" }}
                            >
                              {user.full_name}
                            </p>
                            {isMe && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: "#f1f5f9",
                                  color: "#94a3b8",
                                }}
                              >
                                Tú
                              </span>
                            )}
                          </div>
                          {user.phone && (
                            <p className="text-xs" style={{ color: "#94a3b8" }}>
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: "#0f172a" }}>
                        {user.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          color: role.color,
                          backgroundColor: role.bg,
                          border: `1px solid ${role.border}`,
                        }}
                      >
                        {role.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          color: status.color,
                          backgroundColor: status.bg,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isMe && (
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            color: "#7c3aed",
                            backgroundColor: "#faf5ff",
                            border: "1px solid #e9d5ff",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f3e8ff")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#faf5ff")
                          }
                        >
                          Cambiar contraseña
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cambio de contraseña */}
      {showPasswordModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false);
          }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-xl"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#0f172a" }}>
                  Cambiar contraseña
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                  {selectedUser.full_name} · {selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-sm px-2 py-1 rounded"
                style={{ color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label style={labelStyle}>Nueva contraseña *</label>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, password: e.target.value }))
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
                  value={passwordForm.password_confirmation}
                  onChange={(e) =>
                    setPasswordForm((f) => ({
                      ...f,
                      password_confirmation: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                  style={inputStyle}
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: savingPassword ? "#c4b5fd" : "#7c3aed",
                    color: "#ffffff",
                    cursor: savingPassword ? "not-allowed" : "pointer",
                  }}
                >
                  {savingPassword ? "Guardando..." : "Guardar contraseña"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
