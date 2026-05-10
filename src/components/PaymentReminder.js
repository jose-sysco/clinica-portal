"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

// Muestra un recordatorio sutil los últimos 7 días del mes si la org no ha pagado.
// Se descarta por sesión — vuelve a aparecer al recargar si sigue sin pagar.

export default function PaymentReminder() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const today    = new Date();
    const lastDay  = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    if (lastDay - dayOfMonth > 7) return;

    const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const key    = `payment_reminder_dismissed_${period}`;
    if (sessionStorage.getItem(key)) return;

    api.get("/api/v1/billing/status")
      .then((res) => {
        const { applicable, paid } = res.data;
        if (applicable && !paid) setShow(true);
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  const today   = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - today.getDate();
  const period   = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const dismiss = () => {
    sessionStorage.setItem(`payment_reminder_dismissed_${period}`, "1");
    setShow(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200">
      <div className="flex items-center gap-2.5">
        <span className="text-base">⏰</span>
        <span>
          <strong>Recordatorio de pago:</strong> quedan {daysLeft} día{daysLeft !== 1 ? "s" : ""} para
          finalizar el mes. Contáctanos si ya realizaste tu pago.
        </span>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60 transition-colors"
      >
        Entendido
      </button>
    </div>
  );
}
