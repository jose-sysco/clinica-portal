"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

const TYPE_ICONS = {
  veterinary: "🐾", pediatric: "👶", general: "🏥", dental: "🦷",
  psychology: "🧠", physiotherapy: "💪", nutrition: "🥗", beauty: "✨",
  coaching: "🎯", legal: "⚖️", fitness: "🏋️",
};
const TYPE_COLORS = {
  veterinary: "#10b981", pediatric: "#f59e0b", general: "#3b82f6",
  dental: "#06b6d4", psychology: "#8b5cf6", physiotherapy: "#f97316",
  nutrition: "#22c55e", beauty: "#ec4899", coaching: "#eab308",
  legal: "#64748b", fitness: "#ef4444",
};

export default function ReservasPage() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [typeFilter, setType] = useState("");
  const [debQ, setDebQ]       = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebQ(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (debQ)       p.set("q",    debQ);
    if (typeFilter) p.set("type", typeFilter);
    fetch(`${API}/api/public/clinics?${p}`)
      .then((r) => r.json())
      .then((d) => setClinics(Array.isArray(d) ? d : []))
      .catch(() => setClinics([]))
      .finally(() => setLoading(false));
  }, [debQ, typeFilter]);

  const types = [...new Set(clinics.map((c) => c.clinic_type))];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header — gradiente */}
      <div style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Directorio de clínicas
              </h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.52)" }}>
                Encuentra y reserva tu cita en línea
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs px-3 py-1 rounded-full font-semibold"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.2)" }}>
                Powered by Agendia
              </span>
              <Link href="/login"
                className="text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
                ¿Tienes una clínica? Inicia sesión →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", minWidth: "220px" }} />
            <select value={typeFilter} onChange={(e) => setType(e.target.value)}
              className="text-sm px-4 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: typeFilter ? "#0f172a" : "#94a3b8" }}>
              <option value="">Todos los tipos</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {TYPE_ICONS[t]} {clinics.find((c) => c.clinic_type === t)?.type_label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: "#cbd5e1" }}>Sin resultados</p>
            <p className="text-sm mt-2" style={{ color: "#e2e8f0" }}>Intenta con otro término</p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-5" style={{ color: "#94a3b8" }}>
              {clinics.length} {clinics.length === 1 ? "clínica disponible" : "clínicas disponibles"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinics.map((clinic) => {
                const color = TYPE_COLORS[clinic.clinic_type] || "#64748b";
                const icon  = TYPE_ICONS[clinic.clinic_type]  || "🏥";
                return (
                  <Link key={clinic.slug} href={`/reservas/${clinic.slug}`}
                    className="rounded-2xl p-5 flex flex-col gap-3 transition-all"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", textDecoration: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color + "88";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${color}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: color + "15", border: `1px solid ${color}30` }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>
                          {clinic.name}
                        </p>
                        <p className="text-xs mt-0.5 font-medium" style={{ color }}>
                          {clinic.type_label}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {clinic.city && (
                        <p className="text-xs flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
                          <span>📍</span> {clinic.city}{clinic.country ? `, ${clinic.country}` : ""}
                        </p>
                      )}
                      <p className="text-xs flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
                        <span>👨‍⚕️</span>
                        {clinic.doctors_count} {clinic.doctors_count === 1 ? "profesional" : "profesionales"}
                      </p>
                    </div>

                    <div className="mt-auto pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                      <span className="text-xs font-semibold" style={{ color }}>
                        Reservar cita →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
