"use client";

import { useState, useEffect } from "react";
import { useFeature } from "@/lib/useFeature";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export default function InventoryAlertsPage() {
  const hasInventory = useFeature("inventory");
  const [data,    setData]    = useState({ low_stock: [], expiring_soon: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasInventory) return;
    api.get("/api/v1/inventory/alerts")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Error al cargar alertas"))
      .finally(() => setLoading(false));
  }, [hasInventory]);

  if (!hasInventory) return null;

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
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Alertas de inventario</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Stock bajo y próximos a vencer</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Low stock */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #fecaca", backgroundColor: "#ffffff" }}>
            <div className="px-6 py-4" style={{ backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
              <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                Stock bajo ({data.low_stock.length})
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#ef4444" }}>Productos que están en o por debajo del stock mínimo</p>
            </div>
            {data.low_stock.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "#94a3b8" }}>Sin alertas de stock bajo</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                    {["Producto", "Stock actual", "Stock mínimo", "Unidad", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#94a3b8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.low_stock.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{p.name}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "#dc2626" }}>{parseFloat(p.current_stock).toLocaleString("es-GT")}</td>
                      <td className="px-4 py-3" style={{ color: "#64748b" }}>{parseFloat(p.min_stock).toLocaleString("es-GT")}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#94a3b8" }}>{p.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/inventory/${p.id}`}>
                          <button className="text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                            Ver
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Expiring soon */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #fde68a", backgroundColor: "#ffffff" }}>
            <div className="px-6 py-4" style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
              <p className="text-sm font-semibold" style={{ color: "#d97706" }}>
                Próximos a vencer ({data.expiring_soon.length})
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#f59e0b" }}>Lotes con fecha de vencimiento en los próximos 30 días</p>
            </div>
            {data.expiring_soon.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "#94a3b8" }}>Sin lotes próximos a vencer</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                    {["Producto", "Lote", "Vence", "Días restantes", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "#94a3b8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.expiring_soon.map((m, i) => {
                    const days = daysUntil(m.expiration_date);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{m.product_name}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>{m.lot_number || "—"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#d97706" }}>{fmtDate(m.expiration_date)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: days <= 7 ? "#fef2f2" : "#fffbeb",
                              color:           days <= 7 ? "#dc2626" : "#d97706",
                              border: `1px solid ${days <= 7 ? "#fecaca" : "#fde68a"}`,
                            }}>
                            {days} {days === 1 ? "día" : "días"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/dashboard/inventory/${m.product_id}`}>
                            <button className="text-xs font-medium px-3 py-1.5 rounded-lg"
                              style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                              Ver
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
