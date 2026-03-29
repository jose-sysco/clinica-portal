"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const TYPE_LABEL = { entry: "Entrada", exit: "Salida", adjustment: "Ajuste" };
const TYPE_COLOR = {
  entry:      { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  exit:       { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  adjustment: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
}

const UNITS = ["unidad", "caja", "frasco", "ampolla", "sobre", "tableta", "cápsula", "ml", "mg", "g", "kg", "litro", "rollo", "par"];

const CATEGORIES = [
  "Antibióticos",
  "Analgésicos",
  "Antiinflamatorios",
  "Antiparasitarios",
  "Vacunas",
  "Vitaminas y Suplementos",
  "Desinfectantes y Antisépticos",
  "Material de Curación",
  "Equipos y Dispositivos",
  "Insumos Generales",
  "Medicamentos Controlados",
  "Otros",
];

export default function ProductDetailPage() {
  const { id }          = useParams();
  const { user }        = useAuth();
  const router          = useRouter();
  const canEdit         = user?.role === "admin";

  const [product,    setProduct]    = useState(null);
  const [movements,  setMovements]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mvForm, setMvForm] = useState({
    movement_type: "entry",
    quantity:      "",
    lot_number:    "",
    expiration_date: "",
    notes:         "",
  });

  const [editForm, setEditForm] = useState({
    name: "", description: "", category: "", unit: "unidad", min_stock: "0", sku: "",
  });

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/inventory/${id}`);
      setProduct(res.data);
      setMovements(res.data.movements || []);
      setEditForm({
        name:        res.data.name,
        description: res.data.description || "",
        category:    res.data.category || "",
        unit:        res.data.unit,
        min_stock:   String(res.data.min_stock),
        sku:         res.data.sku || "",
      });
    } catch {
      toast.error("Error al cargar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/api/v1/inventory/${id}/movements`, { stock_movement: mvForm });
      toast.success("Movimiento registrado");
      setShowModal(false);
      setMvForm({ movement_type: "entry", quantity: "", lot_number: "", expiration_date: "", notes: "" });
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al registrar movimiento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/inventory/${id}`, { product: editForm });
      toast.success("Producto actualizado");
      setShowEdit(false);
      fetchProduct();
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0] || "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("¿Desactivar este producto? No aparecerá más en el inventario activo.")) return;
    try {
      await api.delete(`/api/v1/inventory/${id}`);
      toast.success("Producto desactivado");
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Error al desactivar");
    }
  };

  const inp = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const lbl = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventory">
            <button className="text-sm px-3 py-1.5 rounded-lg"
              style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
              ← Volver
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>{product.name}</h1>
              {product.low_stock && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  Stock bajo
                </span>
              )}
            </div>
            {product.category && <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{product.category}</p>}
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)}
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#f8fafc", color: "#0f172a", border: "1px solid #e2e8f0" }}>
              Editar
            </button>
            <button onClick={() => setShowModal(true)}
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
              + Registrar movimiento
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Stock actual",  value: `${parseFloat(product.current_stock).toLocaleString("es-GT")} ${product.unit}`, color: product.low_stock ? "#dc2626" : "#0f172a" },
          { label: "Stock mínimo",  value: parseFloat(product.min_stock) > 0 ? `${parseFloat(product.min_stock).toLocaleString("es-GT")} ${product.unit}` : "Sin alerta" },
          { label: "SKU",           value: product.sku || "—" },
          { label: "Unidad",        value: product.unit },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94a3b8" }}>{label}</p>
            <p className="text-lg font-bold" style={{ color: color || "#0f172a" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Movement history */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f1f5f9" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Historial de movimientos
          </p>
        </div>
        {movements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "#94a3b8" }}>Sin movimientos registrados aún</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                {["Tipo", "Cantidad", "Stock anterior", "Stock resultante", "Lote", "Vencimiento", "Notas", "Usuario", "Fecha"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const tc = TYPE_COLOR[m.movement_type] || TYPE_COLOR.entry;
                const qty = m.movement_type === "exit" ? `-${Math.abs(m.quantity)}` :
                            m.movement_type === "adjustment" ? `=${m.stock_after}` :
                            `+${m.quantity}`;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {TYPE_LABEL[m.movement_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: tc.color }}>{qty}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{parseFloat(m.stock_before).toLocaleString("es-GT")}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#0f172a" }}>{parseFloat(m.stock_after).toLocaleString("es-GT")}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{m.lot_number || "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: m.expiration_date ? "#d97706" : "#64748b" }}>
                      {m.expiration_date ? fmtDate(m.expiration_date) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-32 truncate" style={{ color: "#64748b" }}>{m.notes || "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{m.user?.full_name || "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#94a3b8" }}>{fmtDate(m.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button onClick={handleDeactivate}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            Desactivar producto
          </button>
        </div>
      )}

      {/* Movement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md mx-4" style={{ backgroundColor: "#ffffff" }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <h3 className="text-base font-semibold" style={{ color: "#0f172a" }}>Registrar movimiento</h3>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{product.name}</p>
            </div>
            <form onSubmit={handleMovement} className="p-6 space-y-4">
              <div>
                <label style={lbl}>Tipo de movimiento</label>
                <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                  {[
                    { val: "entry",      label: "Entrada" },
                    { val: "exit",       label: "Salida" },
                    { val: "adjustment", label: "Ajuste" },
                  ].map(({ val, label }) => (
                    <button key={val} type="button"
                      onClick={() => setMvForm((f) => ({ ...f, movement_type: val }))}
                      className="flex-1 py-2 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: mvForm.movement_type === val ? "#2563eb" : "#ffffff",
                        color:           mvForm.movement_type === val ? "#ffffff" : "#64748b",
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>
                  {mvForm.movement_type === "adjustment" ? "Nuevo stock total" : "Cantidad"} *
                </label>
                <input type="number" required min="0.01" step="0.01" style={inp}
                  placeholder={mvForm.movement_type === "adjustment" ? `Stock actual: ${product.current_stock}` : "0"}
                  value={mvForm.quantity}
                  onChange={(e) => setMvForm((f) => ({ ...f, quantity: e.target.value }))} />
                {mvForm.movement_type === "adjustment" && (
                  <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Stock actual: {parseFloat(product.current_stock).toLocaleString("es-GT")} {product.unit}</p>
                )}
              </div>

              {mvForm.movement_type === "entry" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={lbl}>N° de lote</label>
                    <input type="text" placeholder="LOT-001" style={inp}
                      value={mvForm.lot_number}
                      onChange={(e) => setMvForm((f) => ({ ...f, lot_number: e.target.value }))} />
                  </div>
                  <div>
                    <label style={lbl}>Fecha de vencimiento</label>
                    <input type="date" style={inp}
                      value={mvForm.expiration_date}
                      onChange={(e) => setMvForm((f) => ({ ...f, expiration_date: e.target.value }))} />
                  </div>
                </div>
              )}

              <div>
                <label style={lbl}>Notas</label>
                <input type="text" placeholder="Observaciones opcionales..." style={inp}
                  value={mvForm.notes}
                  onChange={(e) => setMvForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: submitting ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? "Guardando..." : "Registrar"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false); }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md mx-4" style={{ backgroundColor: "#ffffff" }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <h3 className="text-base font-semibold" style={{ color: "#0f172a" }}>Editar producto</h3>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label style={lbl}>Nombre *</label>
                <input type="text" required style={inp}
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={lbl}>Categoría</label>
                  <select style={inp}
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="">— Sin categoría —</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>SKU</label>
                  <input type="text" style={inp}
                    value={editForm.sku}
                    onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={lbl}>Unidad</label>
                  <select style={inp} value={editForm.unit}
                    onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Stock mínimo</label>
                  <input type="number" min="0" step="1" style={inp}
                    value={editForm.min_stock}
                    onChange={(e) => setEditForm((f) => ({ ...f, min_stock: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Descripción</label>
                <textarea rows={2} style={{ ...inp, resize: "none" }}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: submitting ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
                <button type="button" onClick={() => setShowEdit(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
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
