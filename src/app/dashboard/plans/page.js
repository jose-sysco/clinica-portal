"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";

// ── Estilos por plan ───────────────────────────────────────────────────────────

const PLAN_STYLE = {
  trial:        { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  basic:        { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  professional: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", highlight: true },
  enterprise:   { color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4" },
};

// ── Iconos ─────────────────────────────────────────────────────────────────────

function CheckIcon({ ok }) {
  if (ok) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Card de plan ───────────────────────────────────────────────────────────────

function PlanCard({ plan, featureList, isCurrent, config }) {
  const style       = PLAN_STYLE[plan.key] || { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
  const isEnterprise = plan.key === "enterprise";

  return (
    <div
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        border:          style.highlight ? `2px solid ${style.color}` : `1px solid ${style.border}`,
        backgroundColor: "#fff",
        boxShadow:       style.highlight ? `0 8px 32px 0 ${style.color}22` : "0 1px 4px 0 rgba(0,0,0,0.04)",
      }}
    >
      {/* Badge "Más popular" */}
      {style.highlight && (
        <div
          className="absolute top-0 inset-x-0 flex items-center justify-center py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ backgroundColor: style.color, color: "#fff" }}
        >
          Más popular
        </div>
      )}

      {/* Badge "Plan actual" */}
      {isCurrent && (
        <div
          className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
        >
          Plan actual
        </div>
      )}

      <div className={`p-6 flex flex-col flex-1 ${style.highlight ? "pt-10" : ""}`}>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.color }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: style.color }}>
              {plan.display_name}
            </span>
          </div>
          <p className="text-sm" style={{ color: "#64748b" }}>{plan.tagline}</p>
        </div>

        {/* Precio */}
        <div className="mb-6 pb-6" style={{ borderBottom: "1px solid #f1f5f9" }}>
          {plan.price_monthly > 0 ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>
                  Q{plan.price_monthly.toFixed(2)}
                </span>
                <span className="text-sm" style={{ color: "#94a3b8" }}>/mes</span>
              </div>
              {plan.price_monthly_usd > 0 && (
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                  ~${plan.price_monthly_usd.toFixed(0)} USD / mes
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold" style={{ color: "#0f172a" }}>Gratis</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>15 días de prueba</p>
            </>
          )}
        </div>

        {/* Límites */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="text-xs font-medium" style={{ color: "#374151" }}>
              {plan.max_doctors == null ? `∞ ${config.staffLabel?.toLowerCase()}` : `${plan.max_doctors} ${plan.max_doctors !== 1 ? config.staffLabel?.toLowerCase() : config.staffSingularLabel?.toLowerCase()}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={style.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-xs font-medium" style={{ color: "#374151" }}>
              {plan.max_patients == null ? "∞ pacientes" : `${plan.max_patients.toLocaleString()} pacientes`}
            </span>
          </div>
        </div>

        {/* Features — se renderizan en el orden que define el backend */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {featureList.map((f) => {
            const included = plan.features.includes(f.key);
            return (
              <li key={f.key} className="flex items-center gap-2.5">
                <CheckIcon ok={included} />
                <span className="text-sm" style={{ color: included ? "#374151" : "#cbd5e1" }}>
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <div
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
          >
            Plan actual
          </div>
        ) : isEnterprise ? (
          <a
            href="mailto:soporte@clinicaportal.com?subject=Plan Enterprise"
            className="w-full block py-2.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-90"
            style={{ backgroundColor: style.color, color: "#fff" }}
          >
            Contactar ventas
          </a>
        ) : (
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
            style={{ backgroundColor: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e8f0" }}
          >
            Próximamente
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function PlansSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl h-96 animate-pulse" style={{ backgroundColor: "#f1f5f9" }} />
      ))}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function PlansPage() {
  const { user, organization, fetchMe } = useAuth();
  const config = getConfig(organization?.clinic_type);

  useEffect(() => { fetchMe(); }, []);

  const [plans,       setPlans]       = useState([]);
  const [featureList, setFeatureList] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    api.get("/api/v1/plans")
      .then((res) => {
        setPlans(res.data.plans);
        setFeatureList(res.data.features);
      })
      .catch(() => setError("No se pudieron cargar los planes"))
      .finally(() => setLoading(false));
  }, []);

  if (user && user.role !== "admin") return <AccessDenied />;

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Planes</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
          Compara los planes disponibles y elige el que mejor se adapta a tu clínica.
        </p>
      </div>

      {/* Banner plan actual */}
      {organization && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 rounded-2xl"
          style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: PLAN_STYLE[organization.plan]?.bg || "#f1f5f9" }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PLAN_STYLE[organization.plan]?.color || "#94a3b8" }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                Actualmente en el plan {organization.plan_display_name || organization.plan}
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {organization.doctors_used} / {organization.plan_max_doctors ?? "∞"} {config.staffLabel?.toLowerCase()}
                &nbsp;·&nbsp;
                {organization.patients_used} / {organization.plan_max_patients ?? "∞"} pacientes
                {organization.on_trial && !organization.trial_expired && (
                  <> · <span style={{ color: "#d97706" }}>{organization.trial_days_remaining} días de prueba restantes</span></>
                )}
              </p>
            </div>
          </div>
          <Link href="/dashboard/settings">
            <button
              className="text-xs font-semibold px-3.5 py-2 rounded-lg"
              style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" }}
            >
              Ver configuración
            </button>
          </Link>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <PlansSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              featureList={featureList}
              isCurrent={organization?.plan === plan.key}
              config={config}
            />
          ))}
        </div>
      )}

      {/* Nota de pago */}
      {!loading && (
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-xl"
          style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm" style={{ color: "#92400e" }}>
            El pago en línea con tarjeta estará disponible próximamente. Para cambiar de plan o activar tu suscripción,{" "}
            <a
              href="mailto:soporte@clinicaportal.com?subject=Cambio de plan"
              className="font-semibold underline"
              style={{ color: "#d97706" }}
            >
              contáctanos por correo
            </a>
            .
          </p>
        </div>
      )}

    </div>
  );
}
