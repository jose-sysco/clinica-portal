"use client";

import { useState, useEffect } from "react";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";

const PLAN_COLORS = {
  trial:        { label: "Trial",       color: "#f59e0b" },
  basic:        { label: "Básico",      color: "#3b82f6" },
  professional: { label: "Profesional", color: "#8b5cf6" },
  enterprise:   { label: "Empresarial", color: "#06b6d4" },
};

const CATEGORY_LABELS = {
  core:          "Funcionalidades principales",
  communication: "Comunicación",
  team:          "Equipo",
  advanced:      "Avanzado",
};

export default function SuperadminPlansPage() {
  const [plans, setPlans]         = useState([]);
  const [allFeatures, setAll]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(null); // plan id being saved
  const [edited, setEdited]       = useState({});   // { planId: { features: [...], price_monthly: X } }

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const r = await superadminApi.get("/api/superadmin/plan_configurations");
      setPlans(r.data.plans);
      setAll(r.data.features);
      // Initialize edited state with current values
      const init = {};
      r.data.plans.forEach((p) => {
        init[p.id] = { features: [...p.features], price_monthly: p.price_monthly };
      });
      setEdited(init);
    } catch {
      toast.error("Error al cargar configuraciones de planes");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (planId, featureKey) => {
    setEdited((prev) => {
      const current = prev[planId]?.features || [];
      const has = current.includes(featureKey);
      return {
        ...prev,
        [planId]: {
          ...prev[planId],
          features: has ? current.filter((f) => f !== featureKey) : [...current, featureKey],
        },
      };
    });
  };

  const updatePrice = (planId, value) => {
    setEdited((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], price_monthly: value },
    }));
  };

  const savePlan = async (plan) => {
    setSaving(plan.id);
    try {
      const data = edited[plan.id];
      await superadminApi.patch(`/api/superadmin/plan_configurations/${plan.id}`, {
        features:      data.features,
        price_monthly: data.price_monthly,
      });
      // Update local plans state
      setPlans((prev) => prev.map((p) =>
        p.id === plan.id ? { ...p, features: data.features, price_monthly: data.price_monthly } : p
      ));
      toast.success(`Plan ${PLAN_COLORS[plan.plan]?.label || plan.name} guardado`);
    } catch {
      toast.error("Error al guardar el plan");
    } finally {
      setSaving(null);
    }
  };

  const isDirty = (plan) => {
    if (!edited[plan.id]) return false;
    const orig = plans.find((p) => p.id === plan.id);
    if (!orig) return false;
    const e = edited[plan.id];
    if (e.price_monthly !== orig.price_monthly) return true;
    const origF = [...orig.features].sort().join(",");
    const editF = [...e.features].sort().join(",");
    return origF !== editF;
  };

  // Group features by category
  const featuresByCategory = Object.entries(allFeatures).reduce((acc, [key, meta]) => {
    const cat = meta.category || "core";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push({ key, ...meta });
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Planes y funcionalidades</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Define qué funcionalidades incluye cada plan de licencia
        </p>
      </div>

      {/* Pricing summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {plans.map((plan) => {
          const meta  = PLAN_COLORS[plan.plan] || {};
          const dirty = isDirty(plan);
          return (
            <div
              key={plan.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: "#1e293b", border: `1px solid ${dirty ? "#334155" : "#1e293b"}` }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: meta.color || "#94a3b8" }}>
                {meta.label || plan.name}
              </p>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs" style={{ color: "#64748b" }}>$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={edited[plan.id]?.price_monthly ?? plan.price_monthly}
                  onChange={(e) => updatePrice(plan.id, parseFloat(e.target.value) || 0)}
                  className="text-lg font-bold w-full outline-none bg-transparent"
                  style={{ color: "#f1f5f9" }}
                />
              </div>
              <p className="text-xs mb-3" style={{ color: "#475569" }}>por mes</p>
              <p className="text-xs" style={{ color: "#475569" }}>
                {edited[plan.id]?.features?.length || 0} funcionalidades
              </p>
              {dirty && (
                <button
                  onClick={() => savePlan(plan)}
                  disabled={saving === plan.id}
                  className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: meta.color || "#3b82f6", color: "#ffffff" }}
                >
                  {saving === plan.id ? "Guardando..." : "Guardar cambios"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Feature matrix */}
      {Object.entries(featuresByCategory).map(([category, features]) => (
        <div key={category} className="rounded-xl overflow-hidden" style={{ border: "1px solid #334155" }}>
          <div className="px-5 py-3" style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
              {CATEGORY_LABELS[category] || category}
            </p>
          </div>

          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #1e293b" }}>
                <th className="text-left px-5 py-3 text-xs font-medium" style={{ color: "#475569", width: "40%" }}>
                  Funcionalidad
                </th>
                {plans.map((plan) => {
                  const meta = PLAN_COLORS[plan.plan] || {};
                  return (
                    <th key={plan.id} className="text-center px-4 py-3 text-xs font-semibold" style={{ color: meta.color || "#94a3b8" }}>
                      {meta.label || plan.name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr
                  key={feature.key}
                  style={{
                    backgroundColor: "#0f172a",
                    borderBottom: i < features.length - 1 ? "1px solid #1e293b" : "none",
                  }}
                >
                  <td className="px-5 py-3">
                    <p className="text-sm" style={{ color: "#94a3b8" }}>{feature.label}</p>
                    <p className="text-xs" style={{ color: "#334155" }}>{feature.key}</p>
                  </td>
                  {plans.map((plan) => {
                    const enabled = edited[plan.id]?.features?.includes(feature.key) ?? false;
                    const meta    = PLAN_COLORS[plan.plan] || {};
                    return (
                      <td key={plan.id} className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleFeature(plan.id, feature.key)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all"
                          style={{
                            backgroundColor: enabled ? `${meta.color}22` : "#1e293b",
                            border:          `1px solid ${enabled ? meta.color : "#334155"}`,
                          }}
                          title={enabled ? "Deshabilitar" : "Habilitar"}
                        >
                          {enabled ? (
                            <span style={{ color: meta.color, fontSize: "14px" }}>✓</span>
                          ) : (
                            <span style={{ color: "#334155", fontSize: "14px" }}>—</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Save all dirty plans */}
      {plans.some(isDirty) && (
        <div
          className="sticky bottom-0 px-5 py-4 rounded-xl flex items-center justify-between"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
        >
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Tienes cambios sin guardar en {plans.filter(isDirty).length} plan(es)
          </p>
          <div className="flex gap-2">
            {plans.filter(isDirty).map((plan) => {
              const meta = PLAN_COLORS[plan.plan] || {};
              return (
                <button
                  key={plan.id}
                  onClick={() => savePlan(plan)}
                  disabled={saving === plan.id}
                  className="text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: meta.color || "#3b82f6", color: "#ffffff" }}
                >
                  {saving === plan.id ? "..." : `Guardar ${meta.label}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
