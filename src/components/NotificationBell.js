"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const TYPE_CONFIG = {
  confirmation: { icon: "✓", color: "#16a34a", bg: "#f0fdf4" },
  reminder:     { icon: "◷", color: "#2563eb", bg: "#eff6ff" },
  cancellation: { icon: "✕", color: "#dc2626", bg: "#fef2f2" },
  reschedule:   { icon: "↺", color: "#d97706", bg: "#fffbeb" },
};

export default function NotificationBell() {
  const router     = useRouter();
  const panelRef   = useRef(null);
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/notifications");
      setNotifications(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/v1/notifications/${id}/mark_as_read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/api/v1/notifications/mark_all_as_read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {}
  };

  const handleClick = (n) => {
    if (!n.read_at) markAsRead(n.id);
    if (n.appointment_id) {
      setOpen(false);
      router.push(`/dashboard/appointments/${n.appointment_id}`);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (diff < 1)    return "ahora";
    if (diff < 60)   return `hace ${diff}m`;
    if (diff < 1440) return `hace ${Math.floor(diff / 60)}h`;
    return new Date(iso).toLocaleDateString("es-GT", { day: "numeric", month: "short" });
  };

  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        style={{
          backgroundColor: open ? "#f1f5f9" : "#f8fafc",
          border: "1px solid #e2e8f0",
          color: "#64748b",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = open ? "#f1f5f9" : "#f8fafc")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: "#ef4444", color: "#ffffff", fontSize: "10px" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 rounded-xl shadow-xl overflow-hidden z-50"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid #f1f5f9" }}
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>Notificaciones</p>
              {unread > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
                >
                  {unread} nueva{unread !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs transition-colors"
                style={{ color: "#64748b" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: "#94a3b8" }}>Sin notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 25).map((n) => {
                const cfg     = TYPE_CONFIG[n.notification_type] || TYPE_CONFIG.confirmation;
                const isUnread = !n.read_at;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
                    style={{
                      borderBottom: "1px solid #f8fafc",
                      backgroundColor: isUnread ? "#fafbff" : "#ffffff",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isUnread ? "#fafbff" : "#ffffff")}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: isUnread ? "#0f172a" : "#64748b" }}
                      >
                        {n.message}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                        {formatTime(n.sent_at || n.created_at)}
                      </p>
                    </div>
                    {isUnread && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: "#2563eb" }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 25 && (
            <div
              className="px-4 py-2.5 text-center"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Mostrando las últimas 25 notificaciones
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
