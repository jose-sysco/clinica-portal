"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import { toast } from "sonner";
import ExportCSVButton from "@/components/ExportCSVButton";
import { WAITLIST_CSV, prepareWaitlist } from "@/lib/exportCSV";
import { TableSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

const STATUS_META = {
  waiting:  { label: "En espera",   color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  notified: { label: "Notificado",  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  booked:   { label: "Agendado",    color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  expired:  { label: "Expirado",    color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.waiting;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ color: m.color, backgroundColor: m.bg, border: `1px solid ${m.border}` }}>
      {m.label}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-GT", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
}

// ── Add to Waitlist Modal ────────────────────────────────────────────────────

function AddWaitlistModal({ onClose, onSaved }) {
  const [doctors,       setDoctors]       = useState([]);
  const [patients,      setPatients]      = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loadingData,   setLoadingData]   = useState(true);
  const [form, setForm] = useState({ doctor_id: "", patient_id: "", owner_id: "", preferred_date: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/v1/doctors",  { params: { per_page: 200 } }),
      api.get("/api/v1/patients", { params: { per_page: 200 } }),
    ]).then(([d, p]) => {
      setDoctors(Array.isArray(d.data?.data)  ? d.data.data  : []);
      setPatients(Array.isArray(p.data?.data) ? p.data.data  : []);
    }).finally(() => setLoadingData(false));
  }, []);

  const handlePatientChange = (patientId) => {
    const patient = patients.find(p => String(p.id) === String(patientId));
    const owner   = patient?.owner || null;
    setSelectedOwner(owner);
    setForm(f => ({ ...f, patient_id: patientId, owner_id: owner ? String(owner.id) : "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor_id || !form.patient_id || !form.owner_id) {
      setError("Doctor y paciente son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/v1/waitlist_entries", { waitlist_entry: form });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.errors?.join(", ") || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
  const inputCls = "w-full text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500";
  const inputStyle = { border: "1px solid #e2e8f0", color: "#0f172a", backgroundColor: "#fff" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#0f172a" }}>Agregar a lista de espera</h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>El staff será notificado cuando se libere un espacio.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-colors hover:bg-slate-100" style={{ color: "#94a3b8" }}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <label className={labelCls} style={{ color: "#64748b" }}>Doctor</label>
                <select value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}
                  className={inputCls} style={inputStyle} required>
                  <option value="">Seleccionar doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name}{d.specialty ? ` — ${d.specialty}` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls} style={{ color: "#64748b" }}>Paciente</label>
                <select value={form.patient_id} onChange={e => handlePatientChange(e.target.value)}
                  className={inputCls} style={inputStyle} required>
                  <option value="">Seleccionar paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.owner?.full_name ? ` (${p.owner.full_name})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Responsable — se llena automático desde el paciente */}
              {selectedOwner && (
                <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#15803d" }}>Responsable asignado automáticamente</p>
                    <p className="text-sm font-medium" style={{ color: "#166534" }}>{selectedOwner.full_name}</p>
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls} style={{ color: "#64748b" }}>Fecha preferida <span className="font-normal normal-case tracking-normal">(opcional)</span></label>
                <input type="date" value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </div>

              <div>
                <label className={labelCls} style={{ color: "#64748b" }}>Notas <span className="font-normal normal-case tracking-normal">(opcional)</span></label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Motivo, disponibilidad horaria..." className={inputCls} style={inputStyle} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg transition-colors hover:bg-slate-100"
                  style={{ color: "#64748b", border: "1px solid #e2e8f0" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm font-medium rounded-lg transition-opacity"
                  style={{ backgroundColor: saving ? "#93c5fd" : "#2563eb", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Guardando..." : "Agregar a la lista"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function WaitlistPage() {
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [filter,     setFilter]     = useState("active"); // active | all
  const [doctorFilter, setDoctorFilter] = useState("");
  const [doctors,    setDoctors]    = useState([]);
  const [actionId,   setActionId]   = useState(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "all") params.status = undefined;
      if (doctorFilter) params.doctor_id = doctorFilter;
      const res = await api.get("/api/v1/waitlist_entries", { params });
      setEntries(res.data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filter, doctorFilter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    api.get("/api/v1/doctors", { params: { per_page: 200 } }).then(r => {
      setDoctors(Array.isArray(r.data?.data) ? r.data.data : []);
    });
  }, []);

  const STATUS_LABEL = { notified: "Notificado", booked: "Agendado" };

  const handleStatusChange = async (entry, newStatus) => {
    setActionId(entry.id);
    try {
      await api.patch(`/api/v1/waitlist_entries/${entry.id}`, { waitlist_entry: { status: newStatus } });
      toast.success(`${entry.patient?.name} marcado como ${STATUS_LABEL[newStatus] || newStatus}`);
      fetchEntries();
    } catch {
      toast.error("Error al actualizar el estado");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar de la lista de espera?")) return;
    setActionId(id);
    try {
      await api.delete(`/api/v1/waitlist_entries/${id}`);
      toast.success("Eliminado de la lista de espera");
      fetchEntries();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setActionId(null);
    }
  };

  const waiting  = entries.filter(e => e.status === "waiting").length;
  const notified = entries.filter(e => e.status === "notified").length;

  return (
    <div className="space-y-6">
      {showModal && <AddWaitlistModal onClose={() => setShowModal(false)} onSaved={fetchEntries} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Lista de espera</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Pacientes esperando un espacio disponible con un doctor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVButton
            filename="lista_espera"
            endpoint="/api/v1/waitlist_entries"
            params={{ ...(doctorFilter && { doctor_id: doctorFilter }) }}
            headers={WAITLIST_CSV.headers}
            keys={WAITLIST_CSV.keys}
            prepare={prepareWaitlist}
          />
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#2563eb", color: "#fff" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Agregar paciente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "En espera",  value: waiting,          color: "#2563eb", bg: "#eff6ff" },
          { label: "Notificados",value: notified,         color: "#d97706", bg: "#fffbeb" },
          { label: "Agendados",  value: entries.filter(e => e.status === "booked").length,  color: "#16a34a", bg: "#f0fdf4" },
          { label: "Total hoy",  value: entries.length,   color: "#64748b", bg: "#f8fafc" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: s.bg, border: "1px solid #e2e8f0" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
          {[["active", "Activos"], ["all", "Todos"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: filter === val ? "#2563eb" : "#fff",
                color:           filter === val ? "#fff"    : "#64748b",
              }}>
              {lbl}
            </button>
          ))}
        </div>
        <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}
          className="text-sm rounded-xl px-3 py-2 outline-none"
          style={{ border: "1px solid #e2e8f0", color: "#334155", backgroundColor: "#fff" }}>
          <option value="">Todos los doctores</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : entries.length === 0 ? (
        <div className="rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <EmptyState
            icon="waitlist"
            title="Lista de espera vacía"
            description="Agrega pacientes aquí cuando un doctor no tenga disponibilidad inmediata."
            action="+ Agregar paciente"
            onClick={() => setShowModal(true)}
          />
        </div>
      ) : (
      <div className="rounded-xl overflow-x-auto shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["#", config?.patientLabel || "Paciente", "Doctor", "Fecha preferida", "Notas", "Registrado", "Estado", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                  className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    {entry.status === "waiting" ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                        style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
                        {entry.position || idx + 1}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium" style={{ color: "#0f172a" }}>{entry.patient?.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{entry.owner?.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium" style={{ color: "#334155" }}>{entry.doctor?.full_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{entry.doctor?.specialty}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap" style={{ color: "#334155" }}>
                    {entry.preferred_date ? fmtDate(entry.preferred_date) : <span style={{ color: "#94a3b8" }}>Cualquier día</span>}
                  </td>
                  <td className="px-4 py-4 max-w-[180px]">
                    <span className="text-xs line-clamp-2" style={{ color: "#64748b" }}>
                      {entry.notes || <span style={{ color: "#cbd5e1" }}>—</span>}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="text-xs" style={{ color: "#64748b" }}>{fmtDate(entry.created_at)}</p>
                    {entry.notified_at && (
                      <p className="text-xs mt-0.5" style={{ color: "#d97706" }}>Notif. {fmtTime(entry.notified_at)}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {entry.status === "waiting" && (
                        <button
                          onClick={() => handleStatusChange(entry, "notified")}
                          disabled={actionId === entry.id}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors hover:opacity-80"
                          style={{ backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                          Notificar
                        </button>
                      )}
                      {(entry.status === "waiting" || entry.status === "notified") && (
                        <button
                          onClick={() => handleStatusChange(entry, "booked")}
                          disabled={actionId === entry.id}
                          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors hover:opacity-80"
                          style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                          Agendado
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={actionId === entry.id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: "#94a3b8" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
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
