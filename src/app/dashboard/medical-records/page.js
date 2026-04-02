"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import AccessDenied from "@/components/AccessDenied";
import { TableSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

export default function MedicalRecordsPage() {
  const { user, organization }      = useAuth();
  const config = getConfig(organization?.clinic_type);
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const debounceRef = useRef(null);

  useEffect(() => { fetchRecords(); }, [page]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); fetchRecords(1, val); }, 350);
  };

  const fetchRecords = async (p = page, q = search) => {
    setLoading(true);
    try {
      const params = { page: p, per_page: 20 };
      const res = await api.get("/api/v1/medical_records", { params });
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-GT", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  if (user && user.role === "receptionist") return <AccessDenied />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Expedientes clínicos</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Historial de consultas registradas
            {pagination && <span style={{ color: "#94a3b8" }}> — {pagination.count} en total</span>}
          </p>
        </div>
        <Link href="/dashboard/medical-records/new">
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          >
            + Nueva consulta
          </button>
        </Link>
      </div>

      {/* Tabla */}
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : records.length === 0 ? (
        <div className="rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <EmptyState
            icon="records"
            title="Sin expedientes aún"
            description="Los expedientes se crean al registrar una consulta desde una cita completada."
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                {["Fecha", "Paciente", config.staffSingularLabel, "Evaluación / Diagnóstico", "Vitales", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr
                  key={record.id}
                  style={{ borderBottom: index < records.length - 1 ? "1px solid #f1f5f9" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{formatDate(record.created_at)}</p>
                  </td>
                  <td className="px-6 py-4">
                    {record.patient ? (
                      <Link href={`/dashboard/patients/${record.patient_id}/records`}>
                        <p className="text-sm font-medium hover:underline" style={{ color: "#2563eb", cursor: "pointer" }}>
                          {record.patient.name}
                        </p>
                      </Link>
                    ) : (
                      <p className="text-sm" style={{ color: "#94a3b8" }}>—</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm" style={{ color: "#0f172a" }}>{record.doctor?.full_name}</p>
                  </td>
                  <td className="px-6 py-4" style={{ maxWidth: "280px" }}>
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {(() => {
                        const t = record.soap_assessment || record.diagnosis || "";
                        return t.length > 70 ? `${t.slice(0, 70)}…` : t || "—";
                      })()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {record.weight      && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{record.weight}lb</span>}
                      {record.temperature && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{record.temperature}°C</span>}
                      {record.heart_rate  && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{record.heart_rate}ppm</span>}
                      {!record.weight && !record.temperature && !record.heart_rate && (
                        <span className="text-xs" style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/medical-records/${record.id}`}>
                      <button
                        className="text-xs font-medium px-3 py-1.5 rounded-lg"
                        style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dbeafe")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}
                      >
                        Ver detalle
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Página {pagination.page} de {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page === 1}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                border: "1px solid #e2e8f0", backgroundColor: "#ffffff",
                color: pagination.page === 1 ? "#cbd5e1" : "#64748b",
                cursor: pagination.page === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page === pagination.pages}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                border: "1px solid #e2e8f0", backgroundColor: "#ffffff",
                color: pagination.page === pagination.pages ? "#cbd5e1" : "#64748b",
                cursor: pagination.page === pagination.pages ? "not-allowed" : "pointer",
              }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
