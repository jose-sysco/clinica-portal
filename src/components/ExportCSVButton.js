"use client";

import { useState } from "react";
import api from "@/lib/api";
import { downloadCSV } from "@/lib/exportCSV";

/**
 * Generic CSV export button.
 *
 * Props:
 *  - filename    {string}    Base filename (date appended automatically)
 *  - endpoint    {string}    API endpoint, e.g. "/api/v1/patients"
 *  - params      {Object}    Extra query params (filters already applied in the page)
 *  - headers     {string[]}  Column labels
 *  - keys        {string[]}  Dot-notation keys per column
 *  - prepare     {Function}  Optional row transformation before export
 *  - dataKey     {string}    Key inside response to find the array (default "data")
 */
export default function ExportCSVButton({ filename, endpoint, params = {}, headers, keys, prepare, dataKey = "data" }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res  = await api.get(endpoint, { params: { ...params, per_page: 10000, page: 1 } });
      let rows   = res.data?.[dataKey] ?? res.data ?? [];
      if (!Array.isArray(rows)) rows = [];
      if (prepare) rows = prepare(rows);
      downloadCSV(filename, headers, keys, rows);
    } catch (e) {
      console.error("CSV export error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      style={{
        backgroundColor: loading ? "#f1f5f9" : "#ffffff",
        color:           loading ? "#94a3b8" : "#64748b",
        border:          "1px solid #e2e8f0",
        cursor:          loading ? "wait" : "pointer",
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.color = "#0f172a"; } }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = loading ? "#f1f5f9" : "#ffffff"; e.currentTarget.style.color = loading ? "#94a3b8" : "#64748b"; }}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block" />
          Exportando...
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </>
      )}
    </button>
  );
}
