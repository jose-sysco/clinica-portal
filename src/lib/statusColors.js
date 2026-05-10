// Tokens de estado reutilizables — cada entry expone clases Tailwind
// con variante dark: incluida, para que un solo className funcione en
// ambos temas. Los hex se exponen aparte para charts (recharts) que
// reciben colores en formato string.

export const APPOINTMENT_STATUS = {
  pending: {
    label: "Pendiente",
    text:   "text-amber-700 dark:text-amber-300",
    bg:     "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900/60",
    dot:    "bg-amber-500",
  },
  confirmed: {
    label: "Confirmada",
    text:   "text-blue-700 dark:text-blue-300",
    bg:     "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900/60",
    dot:    "bg-blue-500",
  },
  in_progress: {
    label: "En curso",
    text:   "text-blue-700 dark:text-blue-300",
    bg:     "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-900/60",
    dot:    "bg-blue-500",
  },
  completed: {
    label: "Completada",
    text:   "text-emerald-700 dark:text-emerald-300",
    bg:     "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900/60",
    dot:    "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelada",
    text:   "text-red-700 dark:text-red-300",
    bg:     "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900/60",
    dot:    "bg-red-500",
  },
  no_show: {
    label: "No asistió",
    text:   "text-red-700 dark:text-red-300",
    bg:     "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-900/60",
    dot:    "bg-red-500",
  },
};

// Hex para recharts y otros consumidores que necesitan strings.
// Tonos saturados que funcionan razonablemente sobre fondo claro y oscuro.
export const APPOINTMENT_STATUS_HEX = {
  pending:     "#f59e0b",
  confirmed:   "#3b82f6",
  in_progress: "#3b82f6",
  completed:   "#22c55e",
  cancelled:   "#ef4444",
  no_show:     "#ef4444",
};

// Variantes para banners/alertas operativas.
export const ALERT_VARIANTS = {
  warning: {
    icon:   "⚠️",
    bg:     "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/60",
    title:  "text-amber-800 dark:text-amber-200",
    text:   "text-amber-700 dark:text-amber-300",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    icon:   "ℹ️",
    bg:     "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/60",
    title:  "text-blue-800 dark:text-blue-200",
    text:   "text-blue-700 dark:text-blue-300",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  danger: {
    icon:   "🚨",
    bg:     "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900/60",
    title:  "text-red-800 dark:text-red-200",
    text:   "text-red-700 dark:text-red-300",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  success: {
    icon:   "✓",
    bg:     "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/60",
    title:  "text-emerald-800 dark:text-emerald-200",
    text:   "text-emerald-700 dark:text-emerald-300",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
};

// Notificaciones (icon + colores) — aplicado en NotificationBell.
export const NOTIFICATION_TYPE = {
  confirmation: { icon: "✓", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  reminder:     { icon: "◷", text: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-950/40" },
  cancellation: { icon: "✕", text: "text-red-700 dark:text-red-300",         bg: "bg-red-50 dark:bg-red-950/40" },
  reschedule:   { icon: "↺", text: "text-amber-700 dark:text-amber-300",     bg: "bg-amber-50 dark:bg-amber-950/40" },
};

// Helpers
export function appointmentStatus(key) {
  return APPOINTMENT_STATUS[key] || APPOINTMENT_STATUS.pending;
}
