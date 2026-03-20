"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const STATUS_CONFIG = {
  active:   { label: "Activo",   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  inactive: { label: "Inactivo", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

export default function OwnerDetailPage() {
  const { id }       = useParams();
  const router       = useRouter();
  const { organization } = useAuth();
  const config       = getConfig(organization?.clinic_type);

  const [owner,    setOwner]    = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ownerRes, patientsRes] = await Promise.all([
        api.get(`/api/v1/owners/${id}`),
        api.get(`/api/v1/owners/${id}/patients`, { params: { per_page: 50 } }),
      ]);
      const o = ownerRes.data;
      setOwner(o);
      // Split full_name into first/last for the edit form
      const parts = (o.full_name || "").split(" ");
      setForm({
        first_name:     parts.slice(0, 1).join(" "),
        last_name:      parts.slice(1).join(" "),
        email:          o.email || "",
        phone:          o.phone || "",
        address:        o.address || "",
        identification: o.identification || "",
      });
      setPatients(patientsRes.data.data || []);
    } catch {
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/owners/${id}`, { owner: form });
      setOwner(res.data);
      setEditing(false);
      toast.success(`${config.ownerLabel} actualizado`);
    } catch (err) {
      const errs = err.response?.data?.errors || ["Error al guardar"];
      toast.error(errs[0]);
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const inp = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const lbl = { display: "block", fontSize: "12px", fontWeight: "500", color: "#94a3b8", marginBottom: "4px" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!owner) return null;

  const initials = owner.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            ← Volver
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#eff6ff" }}>
              <span className="text-lg font-bold" style={{ color: "#2563eb" }}>{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
                {owner.full_name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                {config.ownerLabel} · {owner.patients_count} {owner.patients_count === 1 ? config.patientLabel.toLowerCase() : config.patientsLabel.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/dashboard/owners/${id}/patients`}>
            <button
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}
            >
              Ver {config.patientsLabel.toLowerCase()} →
            </button>
          </Link>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#2563eb", color: "#ffffff", cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Datos del responsable */}
        <div className="lg:col-span-2 rounded-xl p-6 space-y-5"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Datos del {config.ownerLabel.toLowerCase()}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={lbl}>Nombre</label>
              {editing ? (
                <input type="text" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} style={inp} />
              ) : (
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{owner.full_name?.split(" ")[0] || "—"}</p>
              )}
            </div>

            <div>
              <label style={lbl}>Apellido</label>
              {editing ? (
                <input type="text" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} style={inp} />
              ) : (
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{owner.full_name?.split(" ").slice(1).join(" ") || "—"}</p>
              )}
            </div>

            <div>
              <label style={lbl}>Teléfono</label>
              {editing ? (
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} style={inp} placeholder="+502 0000-0000" />
              ) : (
                <p className="text-sm" style={{ color: "#0f172a" }}>{owner.phone || "—"}</p>
              )}
            </div>

            <div>
              <label style={lbl}>Correo electrónico</label>
              {editing ? (
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inp} placeholder="correo@ejemplo.com" />
              ) : (
                <p className="text-sm" style={{ color: "#0f172a" }}>{owner.email || "—"}</p>
              )}
            </div>

            <div>
              <label style={lbl}>Identificación / DPI</label>
              {editing ? (
                <input type="text" value={form.identification} onChange={(e) => set("identification", e.target.value)} style={inp} placeholder="0000 00000 0000" />
              ) : (
                <p className="text-sm font-mono" style={{ color: "#0f172a" }}>{owner.identification || "—"}</p>
              )}
            </div>

            <div>
              <label style={lbl}>Dirección</label>
              {editing ? (
                <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} style={inp} placeholder="Ciudad, país..." />
              ) : (
                <p className="text-sm" style={{ color: "#0f172a" }}>{owner.address || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Acciones rápidas */}
          <div className="rounded-xl p-5 space-y-2" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Acciones</p>
            <Link href={`/dashboard/owners/${id}/patients`}>
              <button className="w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors"
                style={{ color: "#7c3aed", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                📋 Ver {config.patientsLabel.toLowerCase()}
              </button>
            </Link>
            <Link href={`/dashboard/owners/${id}/patients/new`}>
              <button className="w-full text-left text-sm px-3 py-2.5 rounded-lg mt-2 transition-colors"
                style={{ color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                + Nuevo {config.patientLabel.toLowerCase()}
              </button>
            </Link>
            <Link href={`/dashboard/appointments/new?owner_id=${id}`}>
              <button className="w-full text-left text-sm px-3 py-2.5 rounded-lg mt-2 transition-colors"
                style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                + Nueva cita
              </button>
            </Link>
          </div>

          {/* Pacientes */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                {config.patientsLabel}
              </p>
              <Link href={`/dashboard/owners/${id}/patients/new`}>
                <span className="text-xs font-medium" style={{ color: "#2563eb", cursor: "pointer" }}>+ Agregar</span>
              </Link>
            </div>

            {patients.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "#cbd5e1" }}>
                Sin {config.patientsLabel.toLowerCase()} registrados
              </p>
            ) : (
              <div className="space-y-2">
                {patients.map((p) => (
                  <Link key={p.id} href={`/dashboard/patients/${p.id}`}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                      style={{ backgroundColor: "#f8fafc" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#eff6ff" }}>
                        <span className="text-xs font-bold" style={{ color: "#2563eb" }}>{p.name?.[0]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{p.name}</p>
                        {p.species && <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{p.species}{p.breed ? ` · ${p.breed}` : ""}</p>}
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
