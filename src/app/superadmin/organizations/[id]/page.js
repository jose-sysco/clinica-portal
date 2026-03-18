"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";

const clinicTypeLabel = { veterinary: "Veterinaria", pediatric: "Pediatría", general: "Medicina General", dental: "Odontología", psychology: "Psicología" };
const roleLabel = { admin: "Admin", doctor: "Doctor", receptionist: "Recepcionista", patient: "Paciente", superadmin: "Super Admin" };
const statusConfig = {
  active:    { label: "Activa",     color: "#22c55e" },
  inactive:  { label: "Inactiva",   color: "#94a3b8" },
  suspended: { label: "Suspendida", color: "#ef4444" },
};
const planConfig = {
  trial:        { label: "Trial",       color: "#f59e0b" },
  basic:        { label: "Básico",      color: "#3b82f6" },
  professional: { label: "Profesional", color: "#8b5cf6" },
  enterprise:   { label: "Empresarial", color: "#06b6d4" },
};

export default function OrgDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [org, setOrg]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ plan: "", status: "", trial_ends_at: "" });

  useEffect(() => { fetchOrg(); }, []);

  const fetchOrg = async () => {
    try {
      const r = await superadminApi.get(`/api/superadmin/organizations/${id}`);
      setOrg(r.data);
      setForm({
        plan:          r.data.plan,
        status:        r.data.status,
        trial_ends_at: r.data.trial_ends_at ? r.data.trial_ends_at.slice(0, 10) : "",
      });
    } catch {
      toast.error("Error al cargar la organización");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { plan: form.plan, status: form.status };
      if (form.trial_ends_at) payload.trial_ends_at = new Date(form.trial_ends_at).toISOString();
      const r = await superadminApi.patch(`/api/superadmin/organizations/${id}/update_license`, payload);
      setOrg(r.data);
      toast.success("Licencia actualizada correctamente");
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Guatemala" }) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!org) return null;

  const status = statusConfig[org.status] || statusConfig.active;
  const plan   = planConfig[org.plan]     || planConfig.trial;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push("/superadmin/organizations")}
            className="text-xs mb-3 flex items-center gap-1"
            style={{ color: "#475569" }}
          >
            ← Volver a organizaciones
          </button>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>{org.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs" style={{ color: "#475569" }}>{org.slug}</span>
            <span style={{ color: "#334155" }}>·</span>
            <span className="text-xs" style={{ color: "#475569" }}>{clinicTypeLabel[org.clinic_type]}</span>
            <span style={{ color: "#334155" }}>·</span>
            <span className="text-xs" style={{ color: "#475569" }}>Creada {formatDate(org.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: plan.color, border: `1px solid ${plan.color}44`, backgroundColor: `${plan.color}11` }}
          >
            {plan.label}
          </span>
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: status.color, border: `1px solid ${status.color}44`, backgroundColor: `${status.color}11` }}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Info general */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>Información</p>
          {[
            { label: "Email", value: org.email },
            { label: "Teléfono", value: org.phone || "—" },
            { label: "Ciudad", value: [org.city, org.country].filter(Boolean).join(", ") || "—" },
            { label: "Dirección", value: org.address || "—" },
            { label: "Zona horaria", value: org.timezone },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-xs" style={{ color: "#475569" }}>{label}</span>
              <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Estadísticas */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>Estadísticas</p>
          {[
            { label: "Usuarios",   value: org.users_count },
            { label: "Doctores",   value: org.doctors_count },
            { label: "Pacientes",  value: org.patients_count },
            { label: "Citas",      value: org.appointments_count },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-xs" style={{ color: "#475569" }}>{label}</span>
              <span className="text-sm font-bold" style={{ color: "#f1f5f9" }}>{value}</span>
            </div>
          ))}
          {org.on_trial && (
            <>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "#475569" }}>Vence trial</span>
                <span className="text-xs font-medium" style={{ color: org.trial_expired ? "#ef4444" : "#f59e0b" }}>
                  {formatDate(org.trial_ends_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs" style={{ color: "#475569" }}>Estado trial</span>
                <span className="text-xs font-semibold" style={{ color: org.trial_expired ? "#ef4444" : "#22c55e" }}>
                  {org.trial_expired ? "Vencido" : `${org.trial_days_remaining} días restantes`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gestión de licencia */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#475569" }}>
          Gestión de licencia
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>Plan</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
            >
              <option value="trial">Trial (prueba gratuita)</option>
              <option value="basic">Básico</option>
              <option value="professional">Profesional</option>
              <option value="enterprise">Empresarial</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
            >
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="inactive">Inactiva</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>
              Fecha vencimiento trial
            </label>
            <input
              type="date"
              value={form.trial_ends_at}
              onChange={(e) => setForm({ ...form, trial_ends_at: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
            />
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 15);
              setForm({ ...form, plan: "trial", status: "active", trial_ends_at: d.toISOString().slice(0, 10) });
            }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44" }}
          >
            +15 días trial
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 30);
              setForm({ ...form, plan: "trial", status: "active", trial_ends_at: d.toISOString().slice(0, 10) });
            }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44" }}
          >
            +30 días trial
          </button>
          <button
            onClick={() => setForm({ ...form, status: "suspended" })}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}
          >
            Suspender acceso
          </button>
          <button
            onClick={() => setForm({ ...form, plan: "basic", status: "active" })}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#3b82f622", color: "#3b82f6", border: "1px solid #3b82f644" }}
          >
            Activar plan Básico
          </button>
          <button
            onClick={() => setForm({ ...form, plan: "professional", status: "active" })}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "#8b5cf622", color: "#8b5cf6", border: "1px solid #8b5cf644" }}
          >
            Activar Profesional
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Usuarios de la org */}
      {org.users?.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
          <div className="px-5 py-4" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
              Usuarios ({org.users.length})
            </p>
          </div>
          <table className="w-full" style={{ backgroundColor: "#0f172a" }}>
            <tbody>
              {org.users.map((u, i) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: i < org.users.length - 1 ? "1px solid #1e293b" : "none" }}
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{u.full_name}</p>
                    <p className="text-xs" style={{ color: "#475569" }}>{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs" style={{ color: "#64748b" }}>{roleLabel[u.role]}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        color: u.status === "active" ? "#22c55e" : "#ef4444",
                        backgroundColor: u.status === "active" ? "#14532d33" : "#450a0a33",
                      }}
                    >
                      {u.status === "active" ? "Activo" : u.status === "inactive" ? "Inactivo" : "Baneado"}
                    </span>
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
