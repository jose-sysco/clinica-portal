"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { CardGridSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

const STATUS_CONFIG = {
  active:   { label: "Activo",     color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  inactive: { label: "Inactivo",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  on_leave: { label: "De permiso", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
};

const DAY_ORDER = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABEL = { monday:"Lun", tuesday:"Mar", wednesday:"Mié", thursday:"Jue", friday:"Vie", saturday:"Sáb", sunday:"Dom" };

function formatNextAppt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  const diff  = Math.floor((d - today) / 86400000);
  const time  = d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Hoy ${time}`;
  if (diff === 1) return `Mañana ${time}`;
  return d.toLocaleDateString("es-GT", { weekday: "short", day: "numeric", month: "short" }) + ` ${time}`;
}

export default function DoctorsPage() {
  const [doctors,        setDoctors]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [pagination,     setPagination]     = useState(null);
  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState("");
  const [deletingId,     setDeletingId]     = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => { fetchDoctors(); }, [page]);

  // Debounce search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchDoctors(1, val);
    }, 350);
  };

  const fetchDoctors = async (p = page, q = search) => {
    setLoading(true);
    try {
      const params = { page: p };
      if (q) params.q = q;
      const res = await api.get("/api/v1/doctors", { params });
      setDoctors(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  };

  const handleDelete = async (doctor) => {
    setDeletingId(doctor.id);
    try {
      await api.delete(`/api/v1/doctors/${doctor.id}`);
      toast.success(`${doctor.full_name} desactivado correctamente`);
      setConfirmDelete(null);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al desactivar el doctor");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de confirmación de desactivación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setConfirmDelete(null)}>
          <div className="rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold mb-2" style={{ color: "#0f172a" }}>
              ¿Desactivar doctor?
            </h2>
            <p className="text-sm mb-5" style={{ color: "#64748b" }}>
              <span className="font-medium" style={{ color: "#0f172a" }}>{confirmDelete.full_name}</span> quedará
              inactivo y no aparecerá en el listado ni podrá recibir citas nuevas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: deletingId === confirmDelete.id ? "#fca5a5" : "#dc2626",
                  color: "#ffffff",
                  cursor: deletingId === confirmDelete.id ? "not-allowed" : "pointer",
                }}
              >
                {deletingId === confirmDelete.id ? "Desactivando…" : "Desactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Doctores</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Gestión del equipo médico
            {pagination && <span style={{ color: "#94a3b8" }}> — {pagination.count} en total</span>}
          </p>
        </div>
        <Link href="/dashboard/doctors/new">
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
          >
            + Nuevo doctor
          </button>
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o especialidad..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
          style={{ border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a" }}
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="text-sm px-4 py-2.5 rounded-xl"
            style={{ border: "1px solid #e2e8f0", color: "#94a3b8", backgroundColor: "#ffffff" }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <CardGridSkeleton cards={6} cols="grid-cols-1 md:grid-cols-2 xl:grid-cols-3" />
      ) : doctors.length === 0 ? (
        <div className="rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <EmptyState
            icon="doctors"
            title="Sin doctores registrados"
            description={search ? `No se encontraron resultados para "${search}".` : "Agrega tu primer doctor para poder gestionar citas."}
            action={!search ? "+ Nuevo doctor" : undefined}
            href="/dashboard/doctors/new"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map((doctor) => {
            const status     = STATUS_CONFIG[doctor.status] || STATUS_CONFIG.active;
            const activeSch  = doctor.schedules?.filter((s) => s.is_active)
                                 .sort((a,b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week)) || [];
            const nextAppt   = formatNextAppt(doctor.next_appointment?.scheduled_at);
            const initials   = doctor.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2);

            return (
              <div
                key={doctor.id}
                className="rounded-xl flex flex-col"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
              >
                {/* Header */}
                <div className="p-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#eff6ff" }}>
                        <span className="text-sm font-bold" style={{ color: "#2563eb" }}>{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{doctor.full_name}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#64748b" }}>{doctor.specialty}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ color: status.color, backgroundColor: status.bg, border: `1px solid ${status.border}` }}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Stats de citas */}
                <div className="grid grid-cols-3 divide-x" style={{ borderBottom: "1px solid #f1f5f9", divideColor: "#f1f5f9" }}>
                  <div className="px-4 py-3 text-center">
                    <p className="text-lg font-bold" style={{ color: "#0f172a" }}>{doctor.appointments_today ?? 0}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>Hoy</p>
                  </div>
                  <div className="px-4 py-3 text-center" style={{ borderLeft: "1px solid #f1f5f9" }}>
                    <p className="text-lg font-bold" style={{ color: "#0f172a" }}>{doctor.appointments_this_week ?? 0}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>Esta semana</p>
                  </div>
                  <div className="px-4 py-3 text-center" style={{ borderLeft: "1px solid #f1f5f9" }}>
                    <p className="text-lg font-bold" style={{ color: "#0f172a" }}>{doctor.consultation_duration}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>Min/cita</p>
                  </div>
                </div>

                {/* Info */}
                <div className="px-5 py-4 flex-1 space-y-3">
                  {/* Próxima cita */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>Próxima cita</span>
                    <span className="text-xs font-medium" style={{ color: nextAppt ? "#2563eb" : "#cbd5e1" }}>
                      {nextAppt
                        ? `${doctor.next_appointment.patient_name} · ${nextAppt}`
                        : "Sin citas próximas"}
                    </span>
                  </div>

                  {doctor.license_number && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>Cédula</span>
                      <span className="text-xs font-medium" style={{ color: "#0f172a" }}>{doctor.license_number}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>Email</span>
                    <span className="text-xs font-medium truncate ml-4" style={{ color: "#0f172a" }}>{doctor.email}</span>
                  </div>

                  {/* Horario */}
                  {activeSch.length > 0 && (
                    <div>
                      <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>Horario de atención</p>
                      <div className="space-y-1">
                        {/* Agrupar días con el mismo horario */}
                        {(() => {
                          const groups = [];
                          activeSch.forEach((s) => {
                            const key = `${s.start_time}–${s.end_time}`;
                            const existing = groups.find((g) => g.key === key);
                            if (existing) existing.days.push(s.day_of_week);
                            else groups.push({ key, days: [s.day_of_week], start: s.start_time, end: s.end_time });
                          });
                          return groups.map((g) => (
                            <div key={g.key} className="flex items-center justify-between">
                              <div className="flex gap-1">
                                {g.days.map((d) => (
                                  <span key={d} className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                                    {DAY_LABEL[d]}
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs font-medium" style={{ color: "#64748b" }}>
                                {g.start} – {g.end}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {activeSch.length === 0 && (
                    <p className="text-xs" style={{ color: "#e2e8f0" }}>Sin horarios configurados</p>
                  )}
                </div>

                {/* Footer acciones */}
                <div className="grid grid-cols-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                  {[
                    { label: "Editar",      href: `/dashboard/doctors/${doctor.id}/edit`,     color: "#64748b", hoverBg: "#f8fafc" },
                    { label: "Calendario",  href: `/dashboard/doctors/${doctor.id}/calendar`, color: "#7c3aed", hoverBg: "#faf5ff" },
                    { label: "Horario",     href: `/dashboard/doctors/${doctor.id}/schedule`, color: "#2563eb", hoverBg: "#eff6ff" },
                  ].map((action, i) => (
                    <Link key={action.label} href={action.href}>
                      <button
                        className="w-full py-3 text-xs font-medium transition-colors"
                        style={{
                          color: action.color,
                          borderLeft: i > 0 ? "1px solid #f1f5f9" : "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = action.hoverBg)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {action.label}
                      </button>
                    </Link>
                  ))}
                  <button
                    className="w-full py-3 text-xs font-medium transition-colors"
                    style={{ color: "#dc2626", borderLeft: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    onClick={() => setConfirmDelete(doctor)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            Página {pagination.page} de {pagination.pages} — {pagination.count} doctores
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page === 1}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                color: pagination.page === 1 ? "#cbd5e1" : "#64748b",
                cursor: pagination.page === 1 ? "not-allowed" : "pointer",
              }}
            >
              ← Anterior
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`d${i}`} className="text-xs" style={{ color: "#94a3b8" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="text-xs font-medium w-8 h-8 rounded-lg"
                    style={{
                      backgroundColor: pagination.page === p ? "#2563eb" : "#ffffff",
                      color:           pagination.page === p ? "#ffffff" : "#64748b",
                      border:          `1px solid ${pagination.page === p ? "#2563eb" : "#e2e8f0"}`,
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page === pagination.pages}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
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
