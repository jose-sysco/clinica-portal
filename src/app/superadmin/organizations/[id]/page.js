"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";

const clinicTypeLabel = {
  veterinary:    "Veterinaria",
  pediatric:     "Pediatría",
  general:       "Medicina General",
  dental:        "Odontología",
  psychology:    "Psicología",
  physiotherapy: "Fisioterapia",
  nutrition:     "Nutrición",
  beauty:        "Estética y Belleza",
  coaching:      "Coaching",
  legal:         "Servicios Legales",
  fitness:       "Fitness y Deporte",
};
const roleLabel = {
  admin:        "Admin",
  doctor:       "Doctor",
  receptionist: "Recepcionista",
  patient:      "Paciente",
  superadmin:   "Super Admin",
};
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
const planOptions = [
  { value: "trial",        label: "Trial (prueba gratuita)" },
  { value: "basic",        label: "Básico" },
  { value: "professional", label: "Profesional" },
  { value: "enterprise",   label: "Empresarial" },
];
const TABS = ["Información", "Licencia & Precio", "Facturación", "Usuarios"];

function formatDate(d, short = false) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-GT", {
    day: "numeric",
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "America/Guatemala",
  });
}

function formatPeriod(str) {
  if (!str) return "—";
  const [year, month] = str.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("es-GT", { month: "long", year: "numeric" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2" style={{ borderBottom: "1px solid #1e293b" }}>
      <span className="text-xs" style={{ color: "#475569" }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: "#94a3b8", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, color = "#f1f5f9" }) {
  return (
    <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "#475569" }}>{label}</p>
    </div>
  );
}

// ─── Tab: Información ─────────────────────────────────────────────────────────

function TabInformacion({ org }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>
          Datos de contacto
        </p>
        <InfoRow label="Email"        value={org.email} />
        <InfoRow label="Teléfono"     value={org.phone || "—"} />
        <InfoRow label="Ciudad"       value={[org.city, org.country].filter(Boolean).join(", ") || "—"} />
        <InfoRow label="Dirección"    value={org.address || "—"} />
        <InfoRow label="Zona horaria" value={org.timezone} />
        <InfoRow label="IP registro"  value={org.registration_ip || "—"} />
        <InfoRow label="Subdominio"   value={org.subdomain || "—"} />
        <InfoRow label="Registrada"   value={formatDate(org.created_at)} />
      </div>

      <div className="space-y-5">
        <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>
            Uso de la plataforma
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Usuarios"      value={org.users_count} />
            <StatCard label="Profesionales" value={org.doctors_count} color="#3b82f6" />
            <StatCard label="Pacientes"     value={org.patients_count} color="#8b5cf6" />
            <StatCard label="Citas"         value={org.appointments_count} color="#22c55e" />
          </div>
        </div>

        {org.on_trial && (
          <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #f59e0b44" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#f59e0b" }}>
              Estado del trial
            </p>
            <InfoRow label="Vence"        value={formatDate(org.trial_ends_at)} />
            <InfoRow
              label="Estado"
              value={
                org.trial_expired
                  ? "Vencido"
                  : `${org.trial_days_remaining} días restantes`
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Licencia & Precio ───────────────────────────────────────────────────

function TabLicencia({ org, onUpdate }) {
  const [form, setForm] = useState({
    plan:                   org.plan,
    status:                 org.status,
    trial_ends_at:          org.trial_ends_at ? org.trial_ends_at.slice(0, 10) : "",
    locked_price_monthly:   org.locked_price_monthly ?? "",
    locked_price_monthly_usd: org.locked_price_monthly_usd ?? "",
    notes:                  "",
  });
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null); // "suspend" | null
  const [logs, setLogs]       = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await superadminApi.get(`/api/superadmin/organizations/${org.id}/license_logs`);
      setLogs(r.data);
    } catch {
      // non-critical
    } finally {
      setLoadingLogs(false);
    }
  }, [org.id]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        plan:   form.plan,
        status: form.status,
        notes:  form.notes || undefined,
      };
      if (form.trial_ends_at) payload.trial_ends_at = new Date(form.trial_ends_at).toISOString();
      if (form.locked_price_monthly !== "")
        payload.locked_price_monthly = form.locked_price_monthly;
      if (form.locked_price_monthly_usd !== "")
        payload.locked_price_monthly_usd = form.locked_price_monthly_usd;

      const r = await superadminApi.patch(
        `/api/superadmin/organizations/${org.id}/update_license`,
        payload,
      );
      onUpdate(r.data);
      setForm((f) => ({ ...f, notes: "" }));
      await fetchLogs();
      toast.success("Licencia actualizada correctamente");
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al guardar");
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const resetPrice = () => {
    setForm((f) => ({
      ...f,
      locked_price_monthly:     org.plan_price_monthly ?? "",
      locked_price_monthly_usd: org.plan_price_monthly_usd ?? "",
    }));
  };

  const quickAction = (patch) => setForm((f) => ({ ...f, ...patch }));

  const inputStyle = {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    color: "#f1f5f9",
  };

  return (
    <div className="space-y-5">
      {/* License form */}
      <div className="rounded-xl p-5" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#475569" }}>
          Gestión de licencia
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>Plan</label>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle}>
              {planOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>Estado</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle}>
              <option value="active">Activa</option>
              <option value="suspended">Suspendida</option>
              <option value="inactive">Inactiva</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>Vencimiento trial</label>
            <input type="date" value={form.trial_ends_at}
              onChange={(e) => setForm({ ...form, trial_ends_at: e.target.value })}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: "+15 días trial", color: "#f59e0b", action: () => { const d = new Date(); d.setDate(d.getDate() + 15); quickAction({ plan: "trial", status: "active", trial_ends_at: d.toISOString().slice(0, 10) }); } },
            { label: "+30 días trial", color: "#f59e0b", action: () => { const d = new Date(); d.setDate(d.getDate() + 30); quickAction({ plan: "trial", status: "active", trial_ends_at: d.toISOString().slice(0, 10) }); } },
            { label: "Activar Básico",       color: "#3b82f6", action: () => quickAction({ plan: "basic",        status: "active" }) },
            { label: "Activar Profesional",  color: "#8b5cf6", action: () => quickAction({ plan: "professional", status: "active" }) },
            { label: "Activar Empresarial",  color: "#06b6d4", action: () => quickAction({ plan: "enterprise",   status: "active" }) },
            { label: "Suspender acceso",     color: "#ef4444", action: () => setConfirm("suspend") },
          ].map(({ label, color, action }) => (
            <button key={label} onClick={action}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}>
              {label}
            </button>
          ))}
        </div>

        {/* Price section */}
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
              Precio del cliente
            </p>
            <div className="flex items-center gap-3">
              {org.has_custom_price && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: "#f59e0b", backgroundColor: "#f59e0b11", border: "1px solid #f59e0b33" }}>
                  precio especial activo
                </span>
              )}
              <button onClick={resetPrice}
                className="text-xs px-3 py-1 rounded-lg"
                style={{ color: "#64748b", border: "1px solid #334155" }}>
                Resetear al precio del plan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#94a3b8" }}>
                Precio mensual (GTQ)
                {org.plan_price_monthly && (
                  <span className="ml-2 font-normal" style={{ color: "#475569" }}>
                    · precio del plan: Q{Number(org.plan_price_monthly).toFixed(2)}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "#64748b" }}>Q</span>
                <input type="number" min="0" step="0.01" value={form.locked_price_monthly}
                  onChange={(e) => setForm({ ...form, locked_price_monthly: e.target.value })}
                  placeholder={org.plan_price_monthly ?? "0.00"}
                  className="flex-1 text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#94a3b8" }}>
                Precio mensual (USD)
                {org.plan_price_monthly_usd && (
                  <span className="ml-2 font-normal" style={{ color: "#475569" }}>
                    · precio del plan: ${Number(org.plan_price_monthly_usd).toFixed(2)}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "#64748b" }}>$</span>
                <input type="number" min="0" step="0.01" value={form.locked_price_monthly_usd}
                  onChange={(e) => setForm({ ...form, locked_price_monthly_usd: e.target.value })}
                  placeholder={org.plan_price_monthly_usd ?? "0.00"}
                  className="flex-1 text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>
            Motivo del cambio <span style={{ color: "#475569" }}>(opcional — queda en el historial)</span>
          </label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Ej: Cliente solicitó descuento, acuerdo especial por 6 meses..."
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
            style={inputStyle} />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="text-sm font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Audit log */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
        <div className="px-5 py-4" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
            Historial de cambios
          </p>
        </div>

        {loadingLogs ? (
          <div className="flex justify-center py-8" style={{ backgroundColor: "#0f172a" }}>
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center" style={{ backgroundColor: "#0f172a" }}>
            <p className="text-xs" style={{ color: "#334155" }}>Sin cambios registrados aún</p>
          </div>
        ) : (
          <div style={{ backgroundColor: "#0f172a" }}>
            {logs.map((log, i) => (
              <div key={log.id} className="px-5 py-4"
                style={{ borderBottom: i < logs.length - 1 ? "1px solid #1e293b" : "none" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-1">
                      {Object.entries(log.changes).map(([field, { from, to }]) => (
                        <span key={field} className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}>
                          {field}: <span style={{ color: "#ef4444" }}>{from || "—"}</span>
                          {" → "}
                          <span style={{ color: "#22c55e" }}>{to || "—"}</span>
                        </span>
                      ))}
                    </div>
                    {log.notes && (
                      <p className="text-xs mt-1 italic" style={{ color: "#64748b" }}>"{log.notes}"</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium" style={{ color: "#64748b" }}>{log.changed_by}</p>
                    <p className="text-xs" style={{ color: "#334155" }}>
                      {new Date(log.created_at).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
                      {" "}
                      {new Date(log.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm suspend modal */}
      {confirm === "suspend" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setConfirm(null)}>
          <div className="rounded-xl p-6 w-full max-w-sm space-y-4"
            style={{ backgroundColor: "#1e293b", border: "1px solid #ef444444" }}
            onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-semibold" style={{ color: "#f1f5f9" }}>
              ¿Suspender acceso?
            </p>
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              El cliente no podrá iniciar sesión hasta que reactives la organización.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)}
                className="text-xs px-4 py-2 rounded-lg"
                style={{ color: "#64748b", border: "1px solid #334155" }}>
                Cancelar
              </button>
              <button
                onClick={() => { quickAction({ status: "suspended" }); setConfirm(null); }}
                className="text-xs font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                Sí, suspender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Facturación ─────────────────────────────────────────────────────────

function TabFacturacion({ org }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superadminApi
      .get(`/api/superadmin/organizations/${org.id}/billing_history`)
      .then((r) => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [org.id]);

  const totalPaid = records.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Meses registrados" value={records.length} />
        <StatCard label="Total cobrado (GTQ)" value={`Q${totalPaid.toFixed(2)}`} color="#22c55e" />
        <StatCard label="Precio actual/mes"  value={`Q${Number(org.locked_price_monthly ?? 0).toFixed(2)}`}
          color={org.has_custom_price ? "#f59e0b" : "#94a3b8"} />
      </div>

      {/* Records table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
        <div className="px-5 py-4" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
            Historial de pagos
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8" style={{ backgroundColor: "#0f172a" }}>
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center" style={{ backgroundColor: "#0f172a" }}>
            <p className="text-xs" style={{ color: "#334155" }}>Sin pagos registrados</p>
          </div>
        ) : (
          <table className="w-full" style={{ backgroundColor: "#0f172a" }}>
            <thead>
              <tr style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
                {["Período", "Monto pagado", "Esperado", "Diferencia", "Notas", "Registrado por"].map((h) => (
                  <th key={h} className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const diff = r.difference ?? 0;
                return (
                  <tr key={r.id} style={{ borderBottom: i < records.length - 1 ? "1px solid #1e293b" : "none" }}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>
                        {formatPeriod(r.period)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
                        Q{Number(r.amount_paid).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm" style={{ color: "#94a3b8" }}>
                        Q{Number(r.expected ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium"
                        style={{ color: diff >= 0 ? "#22c55e" : "#ef4444" }}>
                        {diff >= 0 ? "+" : ""}Q{diff.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs italic" style={{ color: "#64748b" }}>{r.notes || "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs" style={{ color: "#64748b" }}>{r.recorded_by || "—"}</p>
                      <p className="text-xs" style={{ color: "#334155" }}>
                        {r.recorded_at ? new Date(r.recorded_at).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }) : ""}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Usuarios ────────────────────────────────────────────────────────────

function TabUsuarios({ org }) {
  const [pwModal, setPwModal]   = useState(null);
  const [newPassword, setNewPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingPw(true);
    try {
      await superadminApi.patch(`/api/superadmin/users/${pwModal.id}/change_password`, { password: newPassword });
      toast.success(`Contraseña de ${pwModal.full_name} actualizada`);
      setPwModal(null);
      setNewPw("");
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al cambiar contraseña");
    } finally {
      setSavingPw(false);
    }
  };

  if (!org.users?.length) {
    return (
      <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        <p className="text-sm" style={{ color: "#64748b" }}>Sin usuarios registrados</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
        <div className="px-5 py-4" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
            Usuarios ({org.users.length})
          </p>
        </div>
        <table className="w-full" style={{ backgroundColor: "#0f172a" }}>
          <thead>
            <tr style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
              {["Usuario", "Rol", "Estado", "Último login IP", ""].map((h) => (
                <th key={h} className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#475569" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {org.users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i < org.users.length - 1 ? "1px solid #1e293b" : "none" }}>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{u.full_name}</p>
                  <p className="text-xs" style={{ color: "#475569" }}>{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs" style={{ color: "#64748b" }}>{roleLabel[u.role]}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: u.status === "active" ? "#22c55e" : "#ef4444",
                      backgroundColor: u.status === "active" ? "#14532d33" : "#450a0a33",
                    }}>
                    {u.status === "active" ? "Activo" : u.status === "inactive" ? "Inactivo" : "Baneado"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono" style={{ color: u.last_login_ip ? "#94a3b8" : "#334155" }}>
                    {u.last_login_ip || "—"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => { setPwModal({ id: u.id, full_name: u.full_name }); setNewPw(""); }}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ color: "#f59e0b", backgroundColor: "#451a0333", border: "1px solid #78350f" }}>
                    Cambiar contraseña
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setPwModal(null)}>
          <div className="rounded-xl p-6 w-full max-w-sm space-y-4"
            style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
            onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Cambiar contraseña</p>
            <p className="text-xs" style={{ color: "#64748b" }}>{pwModal.full_name}</p>
            <input type="password" placeholder="Nueva contraseña (mín. 6 caracteres)"
              value={newPassword} onChange={(e) => setNewPw(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" }}
              onKeyDown={(e) => e.key === "Enter" && handleChangePassword()} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPwModal(null)}
                className="text-xs px-4 py-2 rounded-lg"
                style={{ color: "#64748b", border: "1px solid #334155" }}>Cancelar</button>
              <button onClick={handleChangePassword} disabled={savingPw}
                className="text-xs font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#f59e0b", color: "#000" }}>
                {savingPw ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [org, setOrg]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    superadminApi
      .get(`/api/superadmin/organizations/${id}`)
      .then((r) => setOrg(r.data))
      .catch(() => toast.error("Error al cargar la organización"))
      .finally(() => setLoading(false));
  }, [id]);

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
          <button onClick={() => router.push("/superadmin/organizations")}
            className="text-xs mb-3 flex items-center gap-1" style={{ color: "#475569" }}>
            ← Volver a organizaciones
          </button>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>{org.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs" style={{ color: "#475569" }}>{org.slug}</span>
            <span style={{ color: "#334155" }}>·</span>
            <span className="text-xs" style={{ color: "#475569" }}>{clinicTypeLabel[org.clinic_type]}</span>
            <span style={{ color: "#334155" }}>·</span>
            <span className="text-xs" style={{ color: "#475569" }}>Creada {formatDate(org.created_at, true)}</span>
            {org.has_custom_price && (
              <>
                <span style={{ color: "#334155" }}>·</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: "#f59e0b", backgroundColor: "#f59e0b11", border: "1px solid #f59e0b33" }}>
                  precio especial
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: plan.color, border: `1px solid ${plan.color}44`, backgroundColor: `${plan.color}11` }}>
            {plan.label}
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ color: status.color, border: `1px solid ${status.color}44`, backgroundColor: `${status.color}11` }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
        {TABS.map((tab, idx) => (
          <button key={tab} onClick={() => setActiveTab(idx)}
            className="flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            style={
              activeTab === idx
                ? { backgroundColor: "#0f172a", color: "#f1f5f9", border: "1px solid #334155" }
                : { color: "#64748b", border: "1px solid transparent" }
            }>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <TabInformacion org={org} />}
      {activeTab === 1 && <TabLicencia org={org} onUpdate={setOrg} />}
      {activeTab === 2 && <TabFacturacion org={org} />}
      {activeTab === 3 && <TabUsuarios org={org} />}
    </div>
  );
}
