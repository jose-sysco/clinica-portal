"use client";

import { useState, useEffect, useRef } from "react";

const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => parseInt(value?.split("-")[0]) || new Date().getFullYear());
  const ref             = useRef(null);

  const selected = value
    ? { y: parseInt(value.split("-")[0]), m: parseInt(value.split("-")[1]) - 1 }
    : null;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (m) => {
    onChange(`${year}-${String(m + 1).padStart(2, "0")}`);
    setOpen(false);
  };

  const label = selected ? `${MESES_LARGO[selected.m]} ${selected.y}` : "Seleccionar período";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-lg"
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          color: selected ? "#f1f5f9" : "#475569",
          minWidth: "180px",
        }}>
        <span>{label}</span>
        <span style={{ color: "#475569", fontSize: "10px" }}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 rounded-xl p-3 w-52"
          style={{ backgroundColor: "#1e293b", border: "1px solid #334155", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
          {/* Navegación de año */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button type="button" onClick={() => setYear((y) => y - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-sm"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
              ‹
            </button>
            <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{year}</span>
            <button type="button" onClick={() => setYear((y) => y + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-sm"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
              ›
            </button>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-3 gap-1">
            {MESES_CORTO.map((mes, idx) => {
              const isSelected = selected?.y === year && selected?.m === idx;
              return (
                <button key={idx} type="button" onClick={() => pick(idx)}
                  className="text-xs py-1.5 rounded-lg font-medium"
                  style={isSelected
                    ? { backgroundColor: "#2563eb", color: "#fff" }
                    : { color: "#94a3b8" }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "#0f172a"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}>
                  {mes}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
