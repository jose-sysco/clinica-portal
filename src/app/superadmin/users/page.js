"use client";

import { useState, useEffect } from "react";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";

const EMPTY_FORM = {
  first_name: "", last_name: "", email: "", phone: "",
  password: "", password_confirmation: "",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-GT", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function SuperadminUsersPage() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState([]);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await superadminApi.get("/api/superadmin/users");
      setUsers(r.data.data);
    } catch {
      toast.error("Error al cargar los administradores");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const r = await superadminApi.post("/api/superadmin/users", { user: form });
      setUsers((prev) => [r.data, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Administrador creado correctamente");
    } catch (err) {
      const errs = err.response?.data?.errors || [err.response?.data?.error || "Error al crear el administrador"];
      setErrors(errs);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const r = await superadminApi.patch(`/api/superadmin/users/${user.id}`, { user: { status: newStatus } });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? r.data : u)));
      toast.success(`Administrador ${newStatus === "active" ? "activado" : "desactivado"}`);
    } catch {
      toast.error("Error al actualizar el estado");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Administradores</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Usuarios con acceso al backoffice
            {users.length > 0 && <span style={{ color: "#475569" }}> — {users.length} en total</span>}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setErrors([]); setForm(EMPTY_FORM); }}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: showForm ? "#334155" : "#2563eb", color: "#ffffff" }}
        >
          {showForm ? "Cancelar" : "+ Nuevo administrador"}
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-sm font-semibold mb-5" style={{ color: "#f1f5f9" }}>Nuevo administrador</p>

          {errors.length > 0 && (
            <div className="rounded-lg px-4 py-3 mb-4 space-y-1" style={{ backgroundColor: "#450a0a33", border: "1px solid #7f1d1d" }}>
              {errors.map((e, i) => (
                <p key={i} className="text-xs" style={{ color: "#ef4444" }}>{e}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
              {[
                { name: "first_name",            label: "Nombre",               type: "text",     placeholder: "Ana" },
                { name: "last_name",             label: "Apellido",             type: "text",     placeholder: "García" },
                { name: "email",                 label: "Correo electrónico",   type: "email",    placeholder: "ana@clinicaportal.com" },
                { name: "phone",                 label: "Teléfono (opcional)",  type: "tel",      placeholder: "+502 0000-0000" },
                { name: "password",              label: "Contraseña",           type: "password", placeholder: "Mínimo 8 caracteres" },
                { name: "password_confirmation", label: "Confirmar contraseña", type: "password", placeholder: "Repite la contraseña" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#94a3b8" }}>
                    {field.label}
                  </label>
                  <input
                    name={field.name}
                    type={field.type}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    required={field.name !== "phone"}
                    className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
                    style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
              >
                {saving ? "Creando..." : "Crear administrador"}
              </button>
              <p className="text-xs" style={{ color: "#475569" }}>
                El usuario tendrá acceso completo al backoffice
              </p>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-sm" style={{ color: "#64748b" }}>No hay administradores registrados</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
                {["Administrador", "Contacto", "Estado", "Desde", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  style={{
                    backgroundColor: "#0f172a",
                    borderBottom: i < users.length - 1 ? "1px solid #1e293b" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#1d4ed8" }}
                      >
                        <span className="text-xs font-bold" style={{ color: "#ffffff" }}>
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{user.full_name}</p>
                        <p className="text-xs" style={{ color: "#475569" }}>Super Admin</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm" style={{ color: "#94a3b8" }}>{user.email}</p>
                    {user.phone && <p className="text-xs" style={{ color: "#475569" }}>{user.phone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        color:            user.status === "active" ? "#22c55e" : "#94a3b8",
                        backgroundColor:  user.status === "active" ? "#14532d33" : "#1e293b",
                        border: `1px solid ${user.status === "active" ? "#166534" : "#334155"}`,
                      }}
                    >
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs" style={{ color: "#475569" }}>{formatDate(user.created_at)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{
                        color:           user.status === "active" ? "#ef4444" : "#22c55e",
                        backgroundColor: user.status === "active" ? "#450a0a33" : "#14532d33",
                        border:          `1px solid ${user.status === "active" ? "#7f1d1d" : "#166534"}`,
                      }}
                    >
                      {user.status === "active" ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
