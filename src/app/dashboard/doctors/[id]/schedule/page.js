"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const DAYS = [
  { key: "monday",    label: "Lunes",     num: 1 },
  { key: "tuesday",   label: "Martes",    num: 2 },
  { key: "wednesday", label: "Miércoles", num: 3 },
  { key: "thursday",  label: "Jueves",    num: 4 },
  { key: "friday",    label: "Viernes",   num: 5 },
  { key: "saturday",  label: "Sábado",    num: 6 },
  { key: "sunday",    label: "Domingo",   num: 0 },
];

const DEFAULT_HOURS = { start: "08:00", end: "17:00" };

function countSlots(start, end, duration) {
  if (!start || !end || !duration) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? Math.floor(mins / duration) : 0;
}

function formatBlockDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const EMPTY_BLOCK = { start_datetime: "", end_datetime: "", reason: "" };

export default function DoctorSchedulePage() {
  const { id } = useParams();
  const router  = useRouter();

  const [doctor,   setDoctor]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // schedule rows keyed by DAYS index
  const [rows, setRows] = useState(
    DAYS.map((d) => ({ ...d, active: false, start: DEFAULT_HOURS.start, end: DEFAULT_HOURS.end, scheduleId: null, dirty: false }))
  );

  // blocks
  const [blocks,       setBlocks]       = useState([]);
  const [blockForm,    setBlockForm]     = useState(EMPTY_BLOCK);
  const [showBlockForm,setShowBlockForm] = useState(false);
  const [addingBlock,  setAddingBlock]   = useState(false);
  const [deletingBlock,setDeletingBlock] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, blocksRes] = await Promise.all([
        api.get(`/api/v1/doctors/${id}`),
        api.get(`/api/v1/doctors/${id}/schedule_blocks`),
      ]);
      const doc = docRes.data;
      setDoctor(doc);

      // Map existing schedules onto rows
      setRows((prev) =>
        prev.map((row) => {
          const existing = doc.schedules?.find((s) => s.day_of_week === row.key);
          if (existing) {
            return { ...row, active: existing.is_active, start: existing.start_time, end: existing.end_time, scheduleId: existing.id, dirty: false };
          }
          return { ...row, dirty: false };
        })
      );

      setBlocks(blocksRes.data);
    } catch {
      toast.error("Error al cargar el horario");
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value, dirty: true } : r));
  };

  const toggleRow = (index) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, active: !r.active, dirty: true } : r));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    const dirty = rows.filter((r) => r.dirty);
    if (dirty.length === 0) { toast("Sin cambios que guardar"); setSaving(false); return; }

    try {
      await Promise.all(
        dirty.map((row) => {
          if (row.active) {
            if (row.scheduleId) {
              return api.patch(`/api/v1/doctors/${id}/schedules/${row.scheduleId}`, {
                schedule: { start_time: row.start, end_time: row.end, is_active: true },
              });
            } else {
              return api.post(`/api/v1/doctors/${id}/schedules`, {
                schedule: { day_of_week: row.num, start_time: row.start, end_time: row.end, is_active: true },
              });
            }
          } else if (row.scheduleId) {
            return api.patch(`/api/v1/doctors/${id}/schedules/${row.scheduleId}`, {
              schedule: { is_active: false },
            });
          }
          return Promise.resolve();
        })
      );
      toast.success("Horario guardado correctamente");
      fetchData(); // refresh to get new IDs
    } catch (err) {
      const msg = err.response?.data?.errors?.join(", ") || "Error al guardar el horario";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = async () => {
    if (!blockForm.start_datetime || !blockForm.end_datetime) {
      toast.error("Ingresa fechas de inicio y fin");
      return;
    }
    if (new Date(blockForm.end_datetime) <= new Date(blockForm.start_datetime)) {
      toast.error("La fecha fin debe ser posterior al inicio");
      return;
    }
    setAddingBlock(true);
    try {
      const res = await api.post(`/api/v1/doctors/${id}/schedule_blocks`, {
        schedule_block: blockForm,
      });
      setBlocks((prev) => [...prev, res.data].sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)));
      setBlockForm(EMPTY_BLOCK);
      setShowBlockForm(false);
      toast.success("Bloqueo agregado");
    } catch (err) {
      const msg = err.response?.data?.errors?.join(", ") || "Error al agregar bloqueo";
      toast.error(msg);
    } finally {
      setAddingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    setDeletingBlock(blockId);
    try {
      await api.delete(`/api/v1/doctors/${id}/schedule_blocks/${blockId}`);
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      toast.success("Bloqueo eliminado");
    } catch {
      toast.error("Error al eliminar el bloqueo");
    } finally {
      setDeletingBlock(null);
    }
  };

  const hasDirty   = rows.some((r) => r.dirty);
  const totalSlots = rows.filter((r) => r.active).reduce((acc, r) => acc + countSlots(r.start, r.end, doctor?.consultation_duration || 30), 0);

  const inp = "text-sm px-3 py-1.5 rounded-lg outline-none";
  const inpStyle = { border: "1px solid #e2e8f0", backgroundColor: "#ffffff", color: "#0f172a" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
          >
            ← Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
              Horario de atención
            </h1>
            {doctor && (
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                {doctor.full_name} · {doctor.specialty} · {doctor.consultation_duration} min por cita
              </p>
            )}
          </div>
        </div>
        <Link href={`/dashboard/doctors/${id}/availability`}>
          <button
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dbeafe")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}
          >
            Ver disponibilidad →
          </button>
        </Link>
      </div>

      {/* Horario semanal */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
        {/* Card header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>Horario semanal</p>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              Configura los días y horas de atención del doctor
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalSlots > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                {totalSlots} slots por semana
              </span>
            )}
            <button
              onClick={handleSaveSchedule}
              disabled={saving || !hasDirty}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: hasDirty ? "#2563eb" : "#f1f5f9",
                color:           hasDirty ? "#ffffff" : "#cbd5e1",
                cursor:          saving || !hasDirty ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Guardando..." : "Guardar horario"}
            </button>
          </div>
        </div>

        {/* Day rows */}
        <div className="divide-y" style={{ borderColor: "#f8fafc" }}>
          {rows.map((row, index) => {
            const slots  = row.active ? countSlots(row.start, row.end, doctor?.consultation_duration || 30) : 0;
            const isWeekend = row.key === "saturday" || row.key === "sunday";
            return (
              <div
                key={row.key}
                className="px-6 py-4 flex items-center gap-4"
                style={{
                  backgroundColor: row.active ? "#ffffff" : "#fafafa",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleRow(index)}
                  className="relative flex-shrink-0"
                  style={{ width: "40px", height: "22px" }}
                >
                  <div
                    className="absolute inset-0 rounded-full transition-colors"
                    style={{ backgroundColor: row.active ? "#2563eb" : "#e2e8f0" }}
                  />
                  <div
                    className="absolute top-0.5 w-[18px] h-[18px] rounded-full transition-all"
                    style={{
                      left: row.active ? "20px" : "2px",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>

                {/* Day name */}
                <div style={{ width: "90px", flexShrink: 0 }}>
                  <p
                    className="text-sm font-medium"
                    style={{ color: row.active ? "#0f172a" : "#94a3b8" }}
                  >
                    {row.label}
                  </p>
                  {isWeekend && !row.active && (
                    <p className="text-xs" style={{ color: "#cbd5e1" }}>Fin de semana</p>
                  )}
                </div>

                {/* Hours */}
                {row.active ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={row.start}
                      onChange={(e) => updateRow(index, "start", e.target.value)}
                      className={inp}
                      style={inpStyle}
                    />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>hasta</span>
                    <input
                      type="time"
                      value={row.end}
                      onChange={(e) => updateRow(index, "end", e.target.value)}
                      className={inp}
                      style={inpStyle}
                    />

                    {/* Slot count badge */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: slots > 0 ? "#eff6ff" : "#fef2f2",
                          color:           slots > 0 ? "#2563eb" : "#dc2626",
                        }}
                      >
                        {slots > 0 ? `${slots} slots` : "Sin slots"}
                      </span>
                    </div>

                    {/* Dirty indicator */}
                    {row.dirty && (
                      <span className="text-xs" style={{ color: "#f59e0b" }}>● sin guardar</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm flex-1" style={{ color: "#cbd5e1" }}>No disponible</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="px-6 py-4 flex items-center gap-6" style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-medium" style={{ color: "#0f172a" }}>
              {rows.filter((r) => r.active).length}
            </span>
            {" "}días activos
          </div>
          <div className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-medium" style={{ color: "#0f172a" }}>{totalSlots}</span>
            {" "}citas posibles por semana
          </div>
          {doctor?.consultation_duration && (
            <div className="text-xs" style={{ color: "#64748b" }}>
              Duración por cita:{" "}
              <span className="font-medium" style={{ color: "#0f172a" }}>{doctor.consultation_duration} min</span>
            </div>
          )}
        </div>
      </div>

      {/* Bloqueos */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>Bloqueos programados</p>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              Vacaciones, almuerzos, eventos — los slots dentro de estos rangos no aparecerán disponibles
            </p>
          </div>
          <button
            onClick={() => { setShowBlockForm((v) => !v); setBlockForm(EMPTY_BLOCK); }}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dcfce7")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f0fdf4")}
          >
            {showBlockForm ? "✕ Cancelar" : "+ Agregar bloqueo"}
          </button>
        </div>

        {/* Form */}
        {showBlockForm && (
          <div
            className="px-6 py-5 space-y-4"
            style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafffe" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#16a34a" }}>
              Nuevo bloqueo
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>
                  Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={blockForm.start_datetime}
                  onChange={(e) => setBlockForm((f) => ({ ...f, start_datetime: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={inpStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>
                  Fin *
                </label>
                <input
                  type="datetime-local"
                  value={blockForm.end_datetime}
                  onChange={(e) => setBlockForm((f) => ({ ...f, end_datetime: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={inpStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>
                Motivo (opcional)
              </label>
              <input
                type="text"
                placeholder="Vacaciones, almuerzo, capacitación..."
                value={blockForm.reason}
                onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inpStyle}
              />
            </div>
            <button
              onClick={handleAddBlock}
              disabled={addingBlock}
              className="text-sm font-medium px-5 py-2 rounded-lg"
              style={{ backgroundColor: "#16a34a", color: "#ffffff", cursor: addingBlock ? "not-allowed" : "pointer" }}
            >
              {addingBlock ? "Guardando..." : "Guardar bloqueo"}
            </button>
          </div>
        )}

        {/* Blocks list */}
        {blocks.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm" style={{ color: "#94a3b8" }}>Sin bloqueos programados</p>
            <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>
              El doctor está disponible en todos sus horarios configurados
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                {["Desde", "Hasta", "Motivo", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#64748b" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, i) => (
                <tr
                  key={block.id}
                  style={{ borderBottom: i < blocks.length - 1 ? "1px solid #f8fafc" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-6 py-3">
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {formatBlockDate(block.start_datetime)}
                    </p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm" style={{ color: "#0f172a" }}>
                      {formatBlockDate(block.end_datetime)}
                    </p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm" style={{ color: block.reason ? "#0f172a" : "#cbd5e1" }}>
                      {block.reason || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      disabled={deletingBlock === block.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                    >
                      {deletingBlock === block.id ? "..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
