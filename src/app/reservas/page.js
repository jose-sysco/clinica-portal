"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

const TYPE_ICONS = {
  veterinary:    "🐾",
  pediatric:     "👶",
  general:       "🏥",
  dental:        "🦷",
  psychology:    "🧠",
  physiotherapy: "💪",
  nutrition:     "🥗",
  beauty:        "✨",
  coaching:      "🎯",
  legal:         "⚖️",
  fitness:       "🏋️",
};

const TYPE_COLORS = {
  veterinary:    "#10b981",
  pediatric:     "#f59e0b",
  general:       "#3b82f6",
  dental:        "#06b6d4",
  psychology:    "#8b5cf6",
  physiotherapy: "#f97316",
  nutrition:     "#22c55e",
  beauty:        "#ec4899",
  coaching:      "#eab308",
  legal:         "#64748b",
  fitness:       "#ef4444",
};

export default function ReservasPage() {
  const [clinics, setClinics]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [typeFilter, setType]   = useState("");
  const [debouncedQ, setDebQ]   = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebQ(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQ)  params.set("q",    debouncedQ);
    if (typeFilter)  params.set("type", typeFilter);

    fetch(`${API}/api/public/clinics?${params}`)
      .then((r) => r.json())
      .then((data) => setClinics(Array.isArray(data) ? data : []))
      .catch(() => setClinics([]))
      .finally(() => setLoading(false));
  }, [debouncedQ, typeFilter]);

  const types = [...new Set(clinics.map((c) => c.clinic_type))];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1e293b", borderBottom: "1px solid #334155" }}>
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
                Directorio de clínicas
              </h1>
              <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                Encuentra y reserva tu cita en línea
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ backgroundColor: "#2563eb22", color: "#60a5fa", border: "1px solid #2563eb44" }}>
              Powered by Agendia
            </span>
          </div>

          {/* Búsqueda y filtros */}
          <div className="flex flex-wrap gap-3 mt-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#f1f5f9", minWidth: "220px" }}
            />
            <select
              value={typeFilter}
              onChange={(e) => setType(e.target.value)}
              className="text-sm px-4 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: typeFilter ? "#f1f5f9" : "#475569" }}>
              <option value="">Todos los tipos</option>
              {types.map((t) => (
                <option key={t} value={t}>{TYPE_ICONS[t]} {clinics.find((c) => c.clinic_type === t)?.type_label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de clínicas */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: "#334155" }}>Sin resultados</p>
            <p className="text-sm mt-2" style={{ color: "#1e293b" }}>
              Intenta con otro término de búsqueda
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs mb-5" style={{ color: "#475569" }}>
              {clinics.length} {clinics.length === 1 ? "clínica disponible" : "clínicas disponibles"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinics.map((clinic) => {
                const color = TYPE_COLORS[clinic.clinic_type] || "#64748b";
                const icon  = TYPE_ICONS[clinic.clinic_type]  || "🏥";
                return (
                  <Link key={clinic.slug} href={`/reservas/${clinic.slug}`}
                    className="rounded-xl p-5 flex flex-col gap-3 transition-all group"
                    style={{ backgroundColor: "#1e293b", border: "1px solid #334155", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = color + "88")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#334155")}>

                    {/* Top row */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: color + "22", border: `1px solid ${color}44` }}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#f1f5f9" }}>
                          {clinic.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color }}>
                          {clinic.type_label}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      {clinic.city && (
                        <p className="text-xs flex items-center gap-1.5" style={{ color: "#64748b" }}>
                          <span>📍</span> {clinic.city}{clinic.country ? `, ${clinic.country}` : ""}
                        </p>
                      )}
                      <p className="text-xs flex items-center gap-1.5" style={{ color: "#64748b" }}>
                        <span>👨‍⚕️</span>
                        {clinic.doctors_count} {clinic.doctors_count === 1 ? "profesional" : "profesionales"}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-auto pt-2" style={{ borderTop: "1px solid #1e293b" }}>
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
