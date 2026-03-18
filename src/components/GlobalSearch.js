"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const STATUS_COLOR = { pending: "#d97706", confirmed: "#2563eb", completed: "#16a34a", cancelled: "#dc2626" };
const STATUS_LABEL = { pending: "Pendiente", confirmed: "Confirmada", completed: "Completada", cancelled: "Cancelada" };

export default function GlobalSearch({ onClose }) {
  const router      = useRouter();
  const inputRef    = useRef(null);
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(0);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Flatten results for keyboard navigation
  const flat = results
    ? [
        ...results.patients.map((r) => ({ ...r, _type: "patient" })),
        ...results.doctors.map((r)  => ({ ...r, _type: "doctor"  })),
        ...results.appointments.map((r) => ({ ...r, _type: "appointment" })),
      ]
    : [];

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get("/api/v1/search", { params: { q } });
      setResults(res.data);
      setSelected(0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const handleChange = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const navigate = (item) => {
    onClose();
    if (item._type === "patient")     router.push(`/dashboard/patients/${item.id}`);
    if (item._type === "doctor")      router.push(`/dashboard/doctors/${item.id}/calendar`);
    if (item._type === "appointment") router.push(`/dashboard/appointments/${item.id}`);
  };

  const handleKey = (e) => {
    if (e.key === "Escape")    { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && flat[selected]) navigate(flat[selected]);
  };

  const hasResults = results && (results.patients.length + results.doctors.length + results.appointments.length) > 0;
  const noResults  = results && !hasResults;

  let flatIdx = 0;

  const Section = ({ title, items, renderItem }) => {
    if (!items?.length) return null;
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest px-4 py-2" style={{ color: "#94a3b8", backgroundColor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
          {title}
        </p>
        {items.map((item) => {
          const idx = flatIdx++;
          const isSelected = selected === idx;
          return (
            <button
              key={item.id}
              onMouseEnter={() => setSelected(idx)}
              onClick={() => navigate({ ...item, _type: item.type })}
              className="w-full text-left px-4 py-3 transition-colors"
              style={{ backgroundColor: isSelected ? "#eff6ff" : "transparent", borderBottom: "1px solid #f8fafc" }}
            >
              {renderItem(item, isSelected)}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ color: "#94a3b8", fontSize: "16px" }}>⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar pacientes, doctores, citas..."
            className="flex-1 text-sm outline-none"
            style={{ color: "#0f172a", backgroundColor: "transparent" }}
          />
          {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          <kbd className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", color: "#94a3b8", fontFamily: "monospace" }}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "420px", overflowY: "auto" }}>
          {!query && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Búsqueda global</p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>Escribe el nombre de un paciente, doctor o motivo de cita</p>
            </div>
          )}

          {noResults && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Sin resultados para "{query}"</p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>Intenta con otro término</p>
            </div>
          )}

          {hasResults && (
            <>
              <Section
                title="Pacientes"
                items={results.patients}
                renderItem={(item, isSel) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isSel ? "#dbeafe" : "#f1f5f9" }}>
                      <span className="text-xs font-bold" style={{ color: isSel ? "#2563eb" : "#64748b" }}>{item.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{item.name}</p>
                      {item.owner_name && <p className="text-xs" style={{ color: "#94a3b8" }}>{item.owner_name}</p>}
                    </div>
                    <span className="ml-auto text-xs" style={{ color: "#cbd5e1" }}>Paciente</span>
                  </div>
                )}
              />
              <Section
                title="Doctores"
                items={results.doctors}
                renderItem={(item, isSel) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isSel ? "#f3e8ff" : "#f1f5f9" }}>
                      <span className="text-xs font-bold" style={{ color: isSel ? "#7c3aed" : "#64748b" }}>
                        {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{item.name}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{item.specialty}</p>
                    </div>
                    <span className="ml-auto text-xs" style={{ color: "#cbd5e1" }}>Doctor</span>
                  </div>
                )}
              />
              <Section
                title="Citas"
                items={results.appointments}
                renderItem={(item, isSel) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLOR[item.status] + "20" }}>
                      <span style={{ color: STATUS_COLOR[item.status], fontSize: "11px", fontWeight: "700" }}>◷</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{item.patient_name}</p>
                      <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{item.doctor_name} · {item.date}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: STATUS_COLOR[item.status] + "15", color: STATUS_COLOR[item.status] }}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                )}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
          <span className="text-xs" style={{ color: "#94a3b8" }}>
            <kbd style={{ fontFamily: "monospace", marginRight: "4px" }}>↑↓</kbd> navegar
          </span>
          <span className="text-xs" style={{ color: "#94a3b8" }}>
            <kbd style={{ fontFamily: "monospace", marginRight: "4px" }}>↵</kbd> abrir
          </span>
          <span className="text-xs" style={{ color: "#94a3b8" }}>
            <kbd style={{ fontFamily: "monospace", marginRight: "4px" }}>Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
