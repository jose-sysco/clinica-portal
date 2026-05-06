"use client";

import { useState, useEffect, useCallback } from "react";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";
import MonthPicker from "@/app/superadmin/components/MonthPicker";

const PLANS = [
  { key: "basic",        label: "Starter",   color: "#3b82f6" },
  { key: "professional", label: "Pro",        color: "#8b5cf6" },
  { key: "enterprise",   label: "Enterprise", color: "#06b6d4" },
];

const EMPTY_FORM = {
  name: "", email: "", phone: "",
  commission_by_plan: { basic: "", professional: "", enterprise: "" },
};

// ─── Modal crear/editar vendedor ────────────────────────────────────────────
function SalespersonModal({ title, form, setForm, onSave, onClose, saving }) {
  const inputStyle = { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" };

  const totalMonthly = PLANS.reduce((sum, p) => {
    const v = parseFloat(form.commission_by_plan[p.key] || 0);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="rounded-xl p-6 w-full max-w-md space-y-5"
        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        onClick={(e) => e.stopPropagation()}>
        <p className="text-base font-semibold" style={{ color: "#f1f5f9" }}>{title}</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "#94a3b8" }}>
              Nombre <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre completo"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#94a3b8" }}>Email</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#94a3b8" }}>Teléfono</label>
              <input type="text" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+502 0000-0000"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inputStyle} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
              Comisión fija por plan
            </p>
            <span className="text-xs" style={{ color: "#334155" }}>monto en GTQ por cliente/mes</span>
          </div>
          <div className="space-y-2">
            {PLANS.map((plan) => (
              <div key={plan.key} className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
                <span className="text-xs font-semibold w-20 shrink-0" style={{ color: plan.color }}>{plan.label}</span>
                <span className="text-xs" style={{ color: "#475569" }}>Q</span>
                <input
                  type="number" min="0" step="1"
                  value={form.commission_by_plan[plan.key]}
                  onChange={(e) => setForm({
                    ...form,
                    commission_by_plan: { ...form.commission_by_plan, [plan.key]: e.target.value },
                  })}
                  placeholder="0"
                  className="flex-1 text-sm px-2 py-1.5 rounded-lg outline-none bg-transparent"
                  style={{ color: "#f1f5f9" }} />
                {form.commission_by_plan[plan.key] > 0 && (
                  <span className="text-xs shrink-0" style={{ color: "#22c55e" }}>
                    Q{parseFloat(form.commission_by_plan[plan.key]).toFixed(0)}/cliente
                  </span>
                )}
              </div>
            ))}
          </div>
          {totalMonthly > 0 && (
            <p className="text-xs mt-2" style={{ color: "#475569" }}>
              Ejemplo: si tiene 1 cliente de cada plan → Q{totalMonthly.toFixed(0)}/mes
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onClose}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ color: "#64748b", border: "1px solid #334155" }}>Cancelar</button>
          <button onClick={onSave} disabled={saving || !form.name}
            className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de pagos de un vendedor ──────────────────────────────────────────
function fmtPeriod(str) {
  if (!str) return "";
  const [y, m] = str.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("es-GT", { month: "long", year: "numeric" });
}

function PaymentsModal({ salesperson, onClose }) {
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [preview, setPreview]         = useState(null);
  const [loadingPreview, setLPreview] = useState(false);
  const [period, setPeriod]           = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [amount, setAmount]           = useState("");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  const base = `/api/superadmin/salespersons/${salesperson.id}/payments`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await superadminApi.get(base);
      setPayments(r.data);
    } catch {
      toast.error("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const fetchPreview = async (p) => {
    setLPreview(true);
    setPreview(null);
    try {
      const r = await superadminApi.get(`${base}/preview`, { params: { period: p } });
      setPreview(r.data);
      setAmount(String(r.data.calculated_amount));
    } catch {
      toast.error("Error al calcular monto");
    } finally {
      setLPreview(false);
    }
  };

  const handleOpenForm = () => { setShowForm(true); fetchPreview(period); };

  const handlePeriodChange = (val) => {
    setPeriod(val);
    if (showForm) fetchPreview(val);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await superadminApi.post(base, { period, amount: parseFloat(amount), notes: notes || undefined });
      toast.success("Período registrado");
      setShowForm(false);
      setNotes("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al registrar");
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async (p) => {
    try {
      await superadminApi.patch(`${base}/${p.id}`, { paid: !p.paid });
      toast.success(p.paid ? "Revertido a pendiente" : "Marcado como pagado");
      await load();
    } catch { toast.error("Error al actualizar"); }
  };

  const handleDelete = async (p) => {
    try {
      await superadminApi.delete(`${base}/${p.id}`);
      toast.success("Período eliminado");
      await load();
    } catch { toast.error("Error al eliminar"); }
  };

  const inp = { backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9" };

  const pending = payments.filter((p) => !p.paid);
  const paid    = payments.filter((p) => p.paid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={onClose}>
      <div className="rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col"
        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid #334155" }}>
          <div>
            <p className="text-lg font-bold" style={{ color: "#f1f5f9" }}>
              Cuentas por pagar
            </p>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{salesperson.name}</p>
          </div>
          <div className="flex items-center gap-3">
            {!showForm && (
              <button onClick={handleOpenForm}
                className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#2563eb", color: "#fff" }}>
                + Registrar período
              </button>
            )}
            <button onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ color: "#64748b", border: "1px solid #334155" }}>
              Cerrar
            </button>
          </div>
        </div>

        {/* Formulario nuevo período */}
        {showForm && (
          <div className="px-7 py-5" style={{ borderBottom: "1px solid #334155", backgroundColor: "#161f2e" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#475569" }}>
              Nuevo período
            </p>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>Período</label>
                <MonthPicker value={period} onChange={handlePeriodChange} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>
                  Monto (Q)
                  {loadingPreview && <span className="ml-2 text-xs" style={{ color: "#475569" }}>calculando...</span>}
                </label>
                <input type="number" min="0" step="0.01" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inp} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: "#94a3b8" }}>Notas (opcional)</label>
                <input type="text" value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: transferencia bancaria"
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inp} />
              </div>
            </div>

            {preview && preview.breakdown.length > 0 && (
              <div className="rounded-lg px-4 py-3 mb-4"
                style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}>
                <p className="text-xs mb-2" style={{ color: "#475569" }}>
                  Desglose automático — {preview.orgs_count} cliente{preview.orgs_count !== 1 ? "s" : ""} activos
                </p>
                <div className="flex flex-wrap gap-3">
                  {preview.breakdown.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                      style={{ backgroundColor: "#1e293b" }}>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{b.name}</span>
                      <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Q{b.commission.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowForm(false)}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ color: "#64748b", border: "1px solid #334155" }}>Cancelar</button>
              <button onClick={handleCreate} disabled={saving || !amount}
                className="text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
                style={{ backgroundColor: "#2563eb", color: "#fff" }}>
                {saving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-7 py-5 space-y-6" style={{ backgroundColor: "#0f172a" }}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: "#334155" }}>Sin períodos registrados</p>
              <p className="text-xs mt-2" style={{ color: "#1e293b" }}>
                Usa "Registrar período" para comenzar el seguimiento
              </p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>
                    Pendientes ({pending.length})
                  </p>
                  <div className="space-y-2">
                    {pending.map((p) => (
                      <div key={p.id} className="flex items-center gap-5 rounded-xl px-5 py-4"
                        style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
                        <div className="w-36 shrink-0">
                          <p className="text-sm font-semibold capitalize" style={{ color: "#f1f5f9" }}>
                            {fmtPeriod(p.period)}
                          </p>
                        </div>
                        <div className="w-28 shrink-0">
                          <p className="text-lg font-bold" style={{ color: "#22c55e" }}>
                            Q{Number(p.amount).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ backgroundColor: "#78350f33", color: "#fbbf24", border: "1px solid #92400e55" }}>
                            Pendiente
                          </span>
                        </div>
                        {p.notes && (
                          <p className="text-xs italic flex-1" style={{ color: "#475569" }}>{p.notes}</p>
                        )}
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => togglePaid(p)}
                            className="text-sm font-semibold px-4 py-1.5 rounded-lg"
                            style={{ backgroundColor: "#14532d33", color: "#4ade80", border: "1px solid #15803d55" }}>
                            Marcar pagado
                          </button>
                          <button onClick={() => handleDelete(p)}
                            className="text-sm px-3 py-1.5 rounded-lg"
                            style={{ color: "#ef4444", border: "1px solid #450a0a55" }}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {paid.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#334155" }}>
                    Pagados ({paid.length})
                  </p>
                  <div className="space-y-2">
                    {paid.map((p) => (
                      <div key={p.id} className="flex items-center gap-5 rounded-xl px-5 py-4"
                        style={{ backgroundColor: "#111827", border: "1px solid #1e293b" }}>
                        <div className="w-36 shrink-0">
                          <p className="text-sm font-semibold capitalize" style={{ color: "#94a3b8" }}>
                            {fmtPeriod(p.period)}
                          </p>
                        </div>
                        <div className="w-28 shrink-0">
                          <p className="text-base font-bold" style={{ color: "#64748b" }}>
                            Q{Number(p.amount).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ backgroundColor: "#14532d22", color: "#4ade80", border: "1px solid #15803d33" }}>
                            Pagado
                          </span>
                        </div>
                        <div className="flex-1">
                          {p.paid_by && (
                            <p className="text-xs" style={{ color: "#475569" }}>
                              {p.paid_by} · {new Date(p.paid_at).toLocaleDateString("es-GT")}
                            </p>
                          )}
                          {p.notes && (
                            <p className="text-xs italic" style={{ color: "#334155" }}>{p.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => togglePaid(p)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: "#64748b", border: "1px solid #334155" }}>
                            Revertir
                          </button>
                          <button onClick={() => handleDelete(p)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: "#475569", border: "1px solid #1e293b" }}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function SalespersonsPage() {
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [paymentsFor, setPaymentsFor]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await superadminApi.get("/api/superadmin/salespersons");
      setSalespersons(r.data);
    } catch {
      toast.error("Error al cargar vendedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setModal("create"); };
  const openEdit   = (sp) => {
    setForm({
      name:  sp.name,
      email: sp.email || "",
      phone: sp.phone || "",
      commission_by_plan: {
        basic:        sp.commission_by_plan?.basic        ?? "",
        professional: sp.commission_by_plan?.professional ?? "",
        enterprise:   sp.commission_by_plan?.enterprise   ?? "",
      },
    });
    setModal(sp);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name:  form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        commission_by_plan: {
          basic:        parseFloat(form.commission_by_plan.basic        || 0),
          professional: parseFloat(form.commission_by_plan.professional || 0),
          enterprise:   parseFloat(form.commission_by_plan.enterprise   || 0),
        },
      };
      if (modal === "create") {
        await superadminApi.post("/api/superadmin/salespersons", payload);
        toast.success("Vendedor creado");
      } else {
        await superadminApi.patch(`/api/superadmin/salespersons/${modal.id}`, payload);
        toast.success("Vendedor actualizado");
      }
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate  = async (sp) => {
    try {
      await superadminApi.delete(`/api/superadmin/salespersons/${sp.id}`);
      toast.success(`${sp.name} desactivado`);
      await load();
    } catch { toast.error("Error al desactivar"); }
  };

  const handleReactivate = async (sp) => {
    try {
      await superadminApi.patch(`/api/superadmin/salespersons/${sp.id}`, { active: true });
      toast.success(`${sp.name} reactivado`);
      await load();
    } catch { toast.error("Error al reactivar"); }
  };

  const active   = salespersons.filter((s) => s.active);
  const inactive = salespersons.filter((s) => !s.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Vendedores</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gestiona el equipo de ventas, comisiones y cuentas por pagar
          </p>
        </div>
        <button onClick={openCreate}
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
          + Nuevo vendedor
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Activos */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
            <div className="px-5 py-4"
              style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
                Activos ({active.length})
              </p>
            </div>
            {active.length === 0 ? (
              <div className="py-12 text-center" style={{ backgroundColor: "#0f172a" }}>
                <p className="text-sm" style={{ color: "#334155" }}>Sin vendedores activos</p>
              </div>
            ) : (
              <table className="w-full" style={{ backgroundColor: "#0f172a" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
                    {["Vendedor", "Contacto", "Starter", "Pro", "Enterprise", "Clientes", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#475569" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.map((sp, i) => (
                    <tr key={sp.id}
                      style={{ borderBottom: i < active.length - 1 ? "1px solid #1e293b" : "none" }}>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{sp.name}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs" style={{ color: "#94a3b8" }}>{sp.email || "—"}</p>
                        <p className="text-xs" style={{ color: "#3b82f6" }}>{sp.phone || ""}</p>
                      </td>
                      {PLANS.map((plan) => (
                        <td key={plan.key} className="px-5 py-3">
                          {sp.commission_by_plan?.[plan.key] > 0 ? (
                            <span className="text-sm font-bold" style={{ color: plan.color }}>
                              Q{Number(sp.commission_by_plan[plan.key]).toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "#334155" }}>—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-5 py-3">
                        <span className="text-sm" style={{ color: "#94a3b8" }}>{sp.organizations_count}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setPaymentsFor(sp)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: "#22c55e", backgroundColor: "#14532d22", border: "1px solid #14532d44" }}>
                            Pagos
                          </button>
                          <button onClick={() => openEdit(sp)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: "#3b82f6", backgroundColor: "#1e40af22", border: "1px solid #1e40af44" }}>
                            Editar
                          </button>
                          <button onClick={() => handleDeactivate(sp)}
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ color: "#ef4444", backgroundColor: "#450a0a22", border: "1px solid #450a0a44" }}>
                            Desactivar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Inactivos */}
          {inactive.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e293b" }}>
              <div className="px-5 py-4" style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #1e293b" }}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#334155" }}>
                  Inactivos ({inactive.length})
                </p>
              </div>
              <div style={{ backgroundColor: "#0a0f1a" }}>
                {inactive.map((sp, i) => (
                  <div key={sp.id} className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: i < inactive.length - 1 ? "1px solid #0f172a" : "none" }}>
                    <div>
                      <p className="text-sm" style={{ color: "#475569" }}>{sp.name}</p>
                      <p className="text-xs" style={{ color: "#334155" }}>{sp.email || ""}</p>
                    </div>
                    <button onClick={() => handleReactivate(sp)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ color: "#64748b", border: "1px solid #334155" }}>
                      Reactivar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modal && (
        <SalespersonModal
          title={modal === "create" ? "Nuevo vendedor" : `Editar: ${modal.name}`}
          form={form} setForm={setForm}
          onSave={handleSave} onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {paymentsFor && (
        <PaymentsModal
          salesperson={paymentsFor}
          onClose={() => setPaymentsFor(null)}
        />
      )}
    </div>
  );
}
