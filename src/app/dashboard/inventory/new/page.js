"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeature } from "@/lib/useFeature";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

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

export default function NewProductPage() {
  const router      = useRouter();
  const hasInventory = useFeature("inventory");

  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState([]);
  const [form, setForm] = useState({
    name:        "",
    description: "",
    category:    "",
    unit:        "unidad",
    min_stock:   "0",
    sku:         "",
  });

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const res = await api.post("/api/v1/inventory", { product: form });
      toast.success("Producto creado correctamente");
      router.push(`/dashboard/inventory/${res.data.id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || ["Error al crear el producto"]);
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasInventory) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <p className="text-sm" style={{ color: "#64748b" }}>Requiere plan Enterprise</p>
      </div>
    );
  }

  const inp = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const lbl = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventory">
          <button className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            ← Volver
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Nuevo producto</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Agrega un medicamento o insumo al inventario</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="px-4 py-3 rounded-lg text-sm space-y-1"
          style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl p-6 space-y-4" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Información del producto
          </p>

          <div>
            <label style={lbl}>Nombre *</label>
            <input type="text" required placeholder="Amoxicilina 500mg" style={inp}
              value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={lbl}>Categoría</label>
              <select style={inp} value={form.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">— Sin categoría —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>SKU / Código</label>
              <input type="text" placeholder="MED-001" style={inp}
                value={form.sku} onChange={(e) => set("sku", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={lbl}>Descripción</label>
            <textarea rows={2} placeholder="Descripción opcional del producto..." style={{ ...inp, resize: "none" }}
              value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={lbl}>Unidad de medida</label>
              <select style={inp} value={form.unit} onChange={(e) => set("unit", e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Stock mínimo de alerta</label>
              <input type="number" min="0" step="1" placeholder="10" style={inp}
                value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Alerta cuando el stock baje de este valor (0 = sin alerta)</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: submitting ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Guardando..." : "Crear producto"}
          </button>
          <Link href="/dashboard/inventory">
            <button type="button" className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
