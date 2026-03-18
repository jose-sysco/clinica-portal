"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";

export default function OwnersPage() {
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetchOwners();
  }, [page, search]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.q = search;
      const response = await api.get("/api/v1/owners", { params });
      setOwners(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(`Error al cargar los ${config.ownersLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  if (error) {
    return (
      <div
        className="rounded-xl p-4 text-sm"
        style={{
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            {config.ownersLabel}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gestión de {config.ownersLabel.toLowerCase()}
            {pagination && (
              <span style={{ color: "#94a3b8" }}>
                {" "}
                — {pagination.count} en total
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/owners/new">
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1d4ed8")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#2563eb")
            }
          >
            + Nuevo {config.ownerLabel.toLowerCase()}
          </button>
        </Link>
      </div>

      {/* Búsqueda */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder={`Buscar ${config.ownerLabel.toLowerCase()} por nombre, email o teléfono...`}
          className="w-full text-sm outline-none"
          style={{ color: "#0f172a" }}
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : owners.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            No se encontraron {config.ownersLabel.toLowerCase()}
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                }}
              >
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  {config.ownerLabel}
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Contacto
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  Identificación
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#64748b" }}
                >
                  {config.patientsLabel}
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {owners.map((owner, index) => (
                <tr
                  key={owner.id}
                  style={{
                    borderBottom:
                      index < owners.length - 1 ? "1px solid #f1f5f9" : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#eff6ff" }}
                      >
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#2563eb" }}
                        >
                          {owner.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#0f172a" }}
                      >
                        {owner.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {owner.phone}
                    </p>
                    {owner.email && (
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {owner.email}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: "#64748b" }}>
                      {owner.identification || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        color: "#2563eb",
                        backgroundColor: "#eff6ff",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      {owner.patients_count}{" "}
                      {owner.patients_count === 1
                        ? config.patientLabel.toLowerCase()
                        : config.patientsLabel.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/owners/${owner.id}/patients`}>
                      <button
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{
                          color: "#2563eb",
                          backgroundColor: "#eff6ff",
                          border: "1px solid #bfdbfe",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#dbeafe")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#eff6ff")
                        }
                      >
                        Ver {config.patientsLabel.toLowerCase()}
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
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Página {pagination.page} de {pagination.pages} — {pagination.count}{" "}
            {config.ownersLabel.toLowerCase()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page === 1}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                border: "1px solid #e2e8f0",
                backgroundColor: pagination.page === 1 ? "#f8fafc" : "#ffffff",
                color: pagination.page === 1 ? "#cbd5e1" : "#64748b",
                cursor: pagination.page === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Anterior
            </button>

            {/* Números de página */}
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.pages ||
                  Math.abs(p - pagination.page) <= 1,
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="text-xs"
                    style={{ color: "#94a3b8" }}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="text-xs font-medium w-8 h-8 rounded-lg transition-colors"
                    style={{
                      backgroundColor:
                        pagination.page === p ? "#2563eb" : "#ffffff",
                      color: pagination.page === p ? "#ffffff" : "#64748b",
                      border: `1px solid ${pagination.page === p ? "#2563eb" : "#e2e8f0"}`,
                    }}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page === pagination.pages}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                border: "1px solid #e2e8f0",
                backgroundColor:
                  pagination.page === pagination.pages ? "#f8fafc" : "#ffffff",
                color:
                  pagination.page === pagination.pages ? "#cbd5e1" : "#64748b",
                cursor:
                  pagination.page === pagination.pages
                    ? "not-allowed"
                    : "pointer",
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
