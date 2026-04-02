"use client";

import { useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { Suspense } from "react";

const reasons = {
  trial_expired: {
    title: "Tu período de prueba ha terminado",
    description:
      "Los 15 días de prueba gratuita han concluido. Para seguir gestionando tu clínica sin interrupciones, adquiere una suscripción.",
    icon: "⏰",
  },
  license_suspended: {
    title: "Tu licencia está suspendida",
    description:
      "El acceso a tu cuenta ha sido suspendido por el administrador. Si crees que es un error, contacta con soporte.",
    icon: "🔒",
  },
  expired: {
    title: "Tu suscripción ha expirado",
    description:
      "Tu plan actual ha vencido. Renueva tu suscripción para continuar usando el sistema.",
    icon: "📋",
  },
};

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const reasonKey = searchParams.get("reason") || "expired";
  const reason = reasons[reasonKey] || reasons.expired;

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("refresh_token");
    Cookies.remove("organization_slug");
    window.location.href = "/login";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center shadow-sm"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        {/* Ícono */}
        <div className="text-5xl mb-6">{reason.icon}</div>

        {/* Título */}
        <h1 className="text-xl font-bold mb-3" style={{ color: "#0f172a" }}>
          {reason.title}
        </h1>

        {/* Descripción */}
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "#64748b" }}
        >
          {reason.description}
        </p>

        {/* Contacto */}
        <div
          className="rounded-xl p-4 mb-6 text-left"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: "#1d4ed8" }}
          >
            ¿Necesitas ayuda?
          </p>
          <p className="text-xs" style={{ color: "#2563eb" }}>
            Escríbenos a{" "}
            <span className="font-medium">soporte@sysco.com.gt</span> para
            activar tu suscripción.
          </p>
        </div>

        {/* Planes */}
        <div className="space-y-3 mb-6">
          {[
            {
              name: "Básico",
              price: "$29/mes",
              features: "Hasta 2 profesionales · 200 citas/mes",
            },
            {
              name: "Profesional",
              price: "$59/mes",
              features: "Hasta 10 profesionales · citas ilimitadas",
            },
            {
              name: "Empresarial",
              price: "A consultar",
              features: "Multi-sede · soporte prioritario",
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className="rounded-lg p-3 text-left flex items-center justify-between"
              style={{ border: "1px solid #e2e8f0" }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#0f172a" }}
                >
                  {plan.name}
                </p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  {plan.features}
                </p>
              </div>
              <span className="text-sm font-bold" style={{ color: "#2563eb" }}>
                {plan.price}
              </span>
            </div>
          ))}
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2">
          <a
            href="mailto:soporte@sysco.com.gt?subject=Activar suscripción"
            className="w-full py-3 rounded-xl text-sm font-semibold text-center transition-colors"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
          >
            Contactar para activar
          </a>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: "#f8fafc",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionRequiredPage() {
  return (
    <Suspense>
      <SubscriptionContent />
    </Suspense>
  );
}
