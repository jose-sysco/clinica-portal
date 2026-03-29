"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useFeature } from "@/lib/useFeature";
import AccessDenied from "@/components/AccessDenied";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";

function StockBadge({ product }) {
  if (product.low_stock) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
        style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
        Stock bajo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
      OK
    </span>
  );
}

export default function InventoryPage() {
  const { user, organization } = useAuth();
  const hasInventory = useFeature("inventory");

  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("");
  const [filterLow,   setFilterLow]   = useState(false);
  const [categories,  setCategories]  = useState([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);

  const canEdit = user?.role === "admin";

  useEffect(() => {
    if (!hasInventory) return;
    fetchCategories();
  }, [hasInventory]);

  useEffect(() => {
    if (!hasInventory) return;
    fetchProducts();
  }, [hasInventory, search, filterCat, filterLow, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/inventory", {
        params: { q: search || undefined, category: filterCat || undefined, low_stock: filterLow || undefined, page, per_page: 20 },
      });
      setProducts(res.data.data);
      setTotalPages(res.data.pagination?.total_pages || 1);
    } catch {
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/v1/inventory/categories");
      setCategories(res.data.data || []);
    } catch {}
  };

  if (!hasInventory) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
          📦
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>Inventario no disponible</h2>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            El módulo de inventario requiere el plan <strong>Enterprise</strong>.
          </p>
        </div>
        <Link href="/dashboard/settings">
          <button className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}>
            Ver planes →
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Inventario</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Medicamentos e insumos de la clínica
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/inventory/alerts">
            <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Alertas
            </button>
          </Link>
          {canEdit && (
            <Link href="/dashboard/inventory/new">
              <button className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                + Nuevo producto
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 text-sm rounded-lg w-full"
            style={{ border: "1px solid #e2e8f0", outline: "none", backgroundColor: "#ffffff", color: "#0f172a" }}
          />
        </div>

        {categories.length > 0 && (
          <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ border: "1px solid #e2e8f0", outline: "none", backgroundColor: "#ffffff", color: "#0f172a" }}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        <button
          onClick={() => { setFilterLow(!filterLow); setPage(1); }}
          className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: filterLow ? "#fef2f2" : "#f8fafc",
            color:           filterLow ? "#dc2626" : "#64748b",
            border:          `1px solid ${filterLow ? "#fecaca" : "#e2e8f0"}`,
          }}
        >
          Stock bajo
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "#94a3b8" }}>
              {search || filterCat || filterLow ? "Sin resultados para la búsqueda" : "No hay productos registrados aún"}
            </p>
            {canEdit && !search && !filterCat && !filterLow && (
              <Link href="/dashboard/inventory/new">
                <button className="mt-3 text-sm font-medium px-4 py-2 rounded-lg"
                  style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                  Agregar primer producto
                </button>
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                {["Producto", "Categoría", "Stock actual", "Stock mínimo", "Unidad", "Estado", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#94a3b8" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                  className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "#0f172a" }}>{p.name}</p>
                    {p.sku && <p className="text-xs" style={{ color: "#94a3b8" }}>SKU: {p.sku}</p>}
                    {p.description && <p className="text-xs truncate max-w-48" style={{ color: "#64748b" }}>{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{p.category || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: p.low_stock ? "#dc2626" : "#0f172a" }}>
                      {parseFloat(p.current_stock).toLocaleString("es-GT")}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#64748b" }}>
                    {parseFloat(p.min_stock) > 0 ? parseFloat(p.min_stock).toLocaleString("es-GT") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{p.unit}</td>
                  <td className="px-4 py-3"><StockBadge product={p} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/inventory/${p.id}`}>
                      <button className="text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                        Ver detalle
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40"
            style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a" }}>
            ← Anterior
          </button>
          <span className="text-sm" style={{ color: "#64748b" }}>Pág. {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg disabled:opacity-40"
            style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a" }}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
