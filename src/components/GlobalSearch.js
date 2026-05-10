"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFeature } from "@/lib/useFeature";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import { APPOINTMENT_STATUS, appointmentStatus } from "@/lib/statusColors";
import api from "@/lib/api";

export default function GlobalSearch({ onClose }) {
  const router = useRouter();
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);
  const inputRef = useRef(null);
  const hasInventory = useFeature("inventory");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const flat = results
    ? [
        ...results.patients.map((r) => ({ ...r, _type: "patient" })),
        ...results.doctors.map((r) => ({ ...r, _type: "doctor" })),
        ...(results.appointments || []).map((r) => ({ ...r, _type: "appointment" })),
        ...(results.products || []).map((r) => ({ ...r, _type: "product" })),
      ]
    : [];

  const search = useCallback(async (q) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get("/api/v1/search", { params: { q } });
      setResults(res.data);
      setSelected(0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const navigate = (item) => {
    onClose();
    if (item._type === "patient") router.push(`/dashboard/patients/${item.id}`);
    if (item._type === "doctor") router.push(`/dashboard/doctors/${item.id}/calendar`);
    if (item._type === "appointment") router.push(`/dashboard/appointments/${item.id}`);
    if (item._type === "product") router.push(`/dashboard/inventory/${item.id}`);
  };

  const handleKey = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, flat.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    }
    if (e.key === "Enter" && flat[selected]) navigate(flat[selected]);
  };

  const totalResults = results
    ? results.patients.length + results.doctors.length +
      (results.appointments?.length || 0) + (results.products?.length || 0)
    : 0;
  const hasResults = results && totalResults > 0;
  const noResults = results && !hasResults;

  let flatIdx = 0;

  const Section = ({ title, items, renderItem }) => {
    if (!items?.length) return null;
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest px-4 py-2 text-muted-foreground bg-muted/40 border-b border-border">
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
              className={`w-full text-left px-4 py-3 border-b border-border/60 transition-colors ${
                isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""
              }`}
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl bg-popover border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              hasInventory
                ? "Buscar pacientes, profesionales, citas, productos..."
                : "Buscar pacientes, profesionales, citas..."
            }
            className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <kbd className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 bg-muted border border-border text-muted-foreground font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {!query && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium mb-1 text-foreground">Búsqueda global</p>
              <p className="text-xs text-muted-foreground">
                {hasInventory
                  ? "Escribe para buscar pacientes, profesionales, citas o productos del inventario"
                  : "Escribe el nombre de un paciente, profesional o motivo de cita"}
              </p>
            </div>
          )}

          {noResults && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium mb-1 text-foreground">Sin resultados para &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-muted-foreground">Intenta con otro término</p>
            </div>
          )}

          {hasResults && (
            <>
              <Section
                title="Pacientes"
                items={results.patients}
                renderItem={(item, isSel) => (
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSel ? "bg-blue-100 dark:bg-blue-900/60" : "bg-muted"
                    }`}>
                      <span className={`text-xs font-bold ${isSel ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground"}`}>
                        {item.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      {item.owner_name && (
                        <p className="text-xs text-muted-foreground">{item.owner_name}</p>
                      )}
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground/60">Paciente</span>
                  </div>
                )}
              />
              <Section
                title="Doctores"
                items={results.doctors}
                renderItem={(item, isSel) => (
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSel ? "bg-violet-100 dark:bg-violet-900/60" : "bg-muted"
                    }`}>
                      <span className={`text-xs font-bold ${isSel ? "text-violet-700 dark:text-violet-300" : "text-muted-foreground"}`}>
                        {item.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.specialty}</p>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground/60">{config.staffLabel}</span>
                  </div>
                )}
              />
              <Section
                title="Citas"
                items={results.appointments}
                renderItem={(item) => {
                  const st = appointmentStatus(item.status);
                  return (
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className={st.text}>
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate text-foreground">{item.patient_name}</p>
                        <p className="text-xs truncate text-muted-foreground">
                          {item.doctor_name} · {item.date}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                }}
              />
              {hasInventory && (
                <Section
                  title="Inventario"
                  items={results.products}
                  renderItem={(item, isSel) => {
                    const wrap = item.low_stock
                      ? "bg-red-50 dark:bg-red-950/40"
                      : isSel
                        ? "bg-emerald-50 dark:bg-emerald-950/40"
                        : "bg-muted";
                    const stroke = item.low_stock
                      ? "text-red-600 dark:text-red-400"
                      : isSel
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground";
                    return (
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${wrap}`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                               className={stroke}>
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.category && <span>{item.category} · </span>}
                            <span className={item.low_stock ? "text-red-600 dark:text-red-400 font-semibold" : ""}>
                              {item.current_stock} {item.unit}
                              {item.low_stock ? " — Stock bajo" : ""}
                            </span>
                          </p>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground/60">Producto</span>
                      </div>
                    );
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/40">
          <span className="text-xs text-muted-foreground">
            <kbd className="font-mono mr-1">↑↓</kbd> navegar
          </span>
          <span className="text-xs text-muted-foreground">
            <kbd className="font-mono mr-1">↵</kbd> abrir
          </span>
          <span className="text-xs text-muted-foreground">
            <kbd className="font-mono mr-1">Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
