"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
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

const DAY_MAP = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };

function makeBlankRows(locationId) {
  return DAYS.map((d) => ({
    ...d,
    active: false,
    start: "08:00",
    end: d.key === "saturday" || d.key === "sunday" ? "13:00" : "17:00",
    scheduleId: null,
    dirty: false,
    location_id: locationId,
  }));
}

function countSlots(start, end, duration) {
  if (!start || !end || !duration) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? Math.floor(mins / duration) : 0;
}

function formatBlockDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const EMPTY_BLOCK = { start_datetime: "", end_datetime: "", reason: "", location_id: "" };

export default function DoctorSchedulePage() {
  const { id } = useParams();
  const router = useRouter();
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [doctor, setDoctor]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [locations, setLocations] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // null = global

  // Flat rows: each entry has location_id
  const [rows, setRows] = useState(makeBlankRows(null));

  const [blocks, setBlocks]             = useState([]);
  const [blockForm, setBlockForm]       = useState(EMPTY_BLOCK);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [addingBlock, setAddingBlock]   = useState(false);
  const [deletingBlock, setDeletingBlock] = useState(null);

  useEffect(() => {
    fetchData();
    api.get("/api/v1/locations").then((r) => setLocations(r.data)).catch(() => {});
  }, []);

  // Auto-seleccionar primera sede solo si el doctor tiene sedes asignadas
  useEffect(() => {
    if (!loading && doctor?.location_ids?.length > 0 && activeTab === null) {
      const relevant = locations.filter((l) => doctor.location_ids.includes(l.id));
      if (relevant.length > 0) handleTabChange(relevant[0].id);
    }
  }, [loading, locations]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, blocksRes] = await Promise.all([
        api.get(`/api/v1/doctors/${id}`),
        api.get(`/api/v1/doctors/${id}/schedule_blocks`),
      ]);
      const doc = docRes.data;
      setDoctor(doc);

      // Build flat rows array grouped by location_id (same logic as edit page)
      const apiSchedules = doc.schedules || [];

      const mergeRows = (locId, apiSlots) =>
        DAYS.map((d) => {
          const existing = apiSlots.find((s) => DAY_MAP[s.day_of_week] === d.num);
          return existing
            ? { ...d, active: existing.is_active, start: existing.start_time, end: existing.end_time, scheduleId: existing.id, dirty: false, location_id: locId }
            : { ...d, active: false, start: "08:00", end: d.key === "saturday" || d.key === "sunday" ? "13:00" : "17:00", scheduleId: null, dirty: false, location_id: locId };
        });

      const groups = {};
      apiSchedules.forEach((s) => {
        const key = s.location_id ?? null;
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });
      if (!groups[null]) groups[null] = [];

      const built = Object.entries(groups).flatMap(([key, slots]) => {
        const locId = key === "null" || key === null ? null : Number(key);
        return mergeRows(locId, slots);
      });

      setRows(built);
      setBlocks(blocksRes.data);
    } catch {
      toast.error("Error al cargar el horario");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (locId) => {
    if (locId !== null) {
      const hasEntries = rows.some((r) => r.location_id === locId);
      if (!hasEntries) {
        setRows((prev) => [...prev, ...makeBlankRows(locId)]);
      }
    }
    setActiveTab(locId);
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
    if (dirty.length === 0) {
      toast("Sin cambios que guardar");
      setSaving(false);
      return;
    }

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
                schedule: {
                  day_of_week: row.num,
                  start_time: row.start,
                  end_time: row.end,
                  is_active: true,
                  location_id: row.location_id,
                },
              });
            }
          } else if (row.scheduleId) {
            return api.patch(`/api/v1/doctors/${id}/schedules/${row.scheduleId}`, {
              schedule: { is_active: false },
            });
          }
          return Promise.resolve();
        }),
      );
      toast.success("Horario guardado correctamente");
      fetchData();
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
      const payload = { ...blockForm };
      if (!payload.location_id) delete payload.location_id;
      const res = await api.post(`/api/v1/doctors/${id}/schedule_blocks`, { schedule_block: payload });
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

  const visibleRows = rows.filter((r) => r.location_id === activeTab);
  const hasDirty    = rows.some((r) => r.dirty);
  const totalSlots  = visibleRows
    .filter((r) => r.active)
    .reduce((acc, r) => acc + countSlots(r.start, r.end, doctor?.consultation_duration || 30), 0);

  // Tabs solo cuando el doctor tiene sedes asignadas
  const tabLocations = (doctor?.location_ids?.length > 0)
    ? locations.filter((l) => doctor.location_ids.includes(l.id))
    : [];

  const inp      = "text-sm px-3 py-1.5 rounded-lg outline-none";
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
          <button onClick={() => router.back()} className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
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
          <button className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dbeafe")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}>
            Ver disponibilidad →
          </button>
        </Link>
      </div>

      {/* Horario semanal */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>Horario semanal</p>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
              Configura los días y horas de atención del {config.staffLabel}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalSlots > 0 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                {totalSlots} slots por semana
              </span>
            )}
            <button onClick={handleSaveSchedule} disabled={saving || !hasDirty}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: hasDirty ? "#2563eb" : "#f1f5f9",
                color: hasDirty ? "#ffffff" : "#cbd5e1",
                cursor: saving || !hasDirty ? "not-allowed" : "pointer",
              }}>
              {saving ? "Guardando..." : "Guardar horario"}
            </button>
          </div>
        </div>

        {/* Aviso cuando atiende en todas las sedes */}
        {locations.length > 0 && tabLocations.length === 0 && (
          <div className="px-6 py-3" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fffbeb" }}>
            <p className="text-xs" style={{ color: "#92400e" }}>
              Este especialista atiende en todas las sedes — el horario general aplica en todas.
              Para configurar horarios por sede, asígnale sedes específicas en{" "}
              <span style={{ fontWeight: 600 }}>Editar especialista</span>.
            </p>
          </div>
        )}

        {/* Tabs por sede — solo si tiene sedes asignadas */}
        {tabLocations.length > 0 && (
          <div className="px-6 py-3 flex flex-wrap gap-2" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}>
            {tabLocations.map((loc) => (
              <button key={loc.id} type="button" onClick={() => handleTabChange(loc.id)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={activeTab === loc.id
                  ? { backgroundColor: "#2563eb", color: "#fff" }
                  : { backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
                {loc.name}
              </button>
            ))}
            {activeTab !== null && (
              <span className="text-xs self-center" style={{ color: "#94a3b8" }}>
                Horario para {locations.find((l) => l.id === activeTab)?.name}
              </span>
            )}
          </div>
        )}

        {/* Day rows */}
        <div className="divide-y" style={{ borderColor: "#f8fafc" }}>
          {visibleRows.map((row) => {
            const index  = rows.findIndex((r) => r.num === row.num && r.location_id === activeTab);
            const slots  = row.active ? countSlots(row.start, row.end, doctor?.consultation_duration || 30) : 0;
            const isWeekend = row.key === "saturday" || row.key === "sunday";
            return (
              <div key={`${row.key}-${activeTab}`} className="px-6 py-4 flex items-center gap-4"
                style={{ backgroundColor: row.active ? "#ffffff" : "#fafafa", borderBottom: "1px solid #f8fafc" }}>
                {/* Toggle */}
                <button type="button" onClick={() => toggleRow(index)}
                  className="relative flex-shrink-0" style={{ width: "40px", height: "22px" }}>
                  <div className="absolute inset-0 rounded-full transition-colors"
                    style={{ backgroundColor: row.active ? "#2563eb" : "#e2e8f0" }} />
                  <div className="absolute top-0.5 w-[18px] h-[18px] rounded-full transition-all"
                    style={{ left: row.active ? "20px" : "2px", backgroundColor: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>

                {/* Day name */}
                <div style={{ width: "90px", flexShrink: 0 }}>
                  <p className="text-sm font-medium" style={{ color: row.active ? "#0f172a" : "#94a3b8" }}>
                    {row.label}
                  </p>
                  {isWeekend && !row.active && (
                    <p className="text-xs" style={{ color: "#cbd5e1" }}>Fin de semana</p>
                  )}
                </div>

                {/* Hours */}
                {row.active ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={row.start}
                      onChange={(e) => updateRow(index, "start", e.target.value)}
                      className={inp} style={inpStyle} />
                    <span className="text-xs" style={{ color: "#94a3b8" }}>hasta</span>
                    <input type="time" value={row.end}
                      onChange={(e) => updateRow(index, "end", e.target.value)}
                      className={inp} style={inpStyle} />
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-lg"
                        style={{ backgroundColor: slots > 0 ? "#eff6ff" : "#fef2f2", color: slots > 0 ? "#2563eb" : "#dc2626" }}>
                        {slots > 0 ? `${slots} slots` : "Sin slots"}
                      </span>
                    </div>
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
        <div className="px-6 py-4 flex items-center gap-6"
          style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}>
          <div className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-medium" style={{ color: "#0f172a" }}>
              {visibleRows.filter((r) => r.active).length}
            </span>{" "}días activos
          </div>
          <div className="text-xs" style={{ color: "#64748b" }}>
            <span className="font-medium" style={{ color: "#0f172a" }}>{totalSlots}</span>{" "}citas posibles por semana
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
          <button onClick={() => { setShowBlockForm((v) => !v); setBlockForm(EMPTY_BLOCK); }}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#dcfce7")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f0fdf4")}>
            {showBlockForm ? "✕ Cancelar" : "+ Agregar bloqueo"}
          </button>
        </div>

        {/* Form */}
        {showBlockForm && (
          <div className="px-6 py-5 space-y-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafffe" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#16a34a" }}>
              Nuevo bloqueo
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Inicio *</label>
                <input type="datetime-local" value={blockForm.start_datetime}
                  onChange={(e) => setBlockForm((f) => ({ ...f, start_datetime: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inpStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>Fin *</label>
                <input type="datetime-local" value={blockForm.end_datetime}
                  onChange={(e) => setBlockForm((f) => ({ ...f, end_datetime: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inpStyle} />
              </div>
            </div>

            {/* Sede del bloqueo (solo si org tiene sedes) */}
            {locations.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>
                  Sede afectada
                </label>
                <select value={blockForm.location_id}
                  onChange={(e) => setBlockForm((f) => ({ ...f, location_id: e.target.value }))}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inpStyle}>
                  <option value="">Todas las sedes</option>
                  {tabLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  "Todas las sedes" bloquea al especialista sin importar dónde atienda
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>
                Motivo (opcional)
              </label>
              <input type="text" placeholder="Vacaciones, almuerzo, capacitación..."
                value={blockForm.reason}
                onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none" style={inpStyle} />
            </div>
            <button onClick={handleAddBlock} disabled={addingBlock}
              className="text-sm font-medium px-5 py-2 rounded-lg"
              style={{ backgroundColor: "#16a34a", color: "#ffffff", cursor: addingBlock ? "not-allowed" : "pointer" }}>
              {addingBlock ? "Guardando..." : "Guardar bloqueo"}
            </button>
          </div>
        )}

        {/* Blocks list */}
        {blocks.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm" style={{ color: "#94a3b8" }}>Sin bloqueos programados</p>
            <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>
              El {config.staffLabel} está disponible en todos sus horarios configurados
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                {["Desde", "Hasta", "Motivo", locations.length > 0 ? "Sede" : null, ""].filter(Boolean).map((h) => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#64748b" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, i) => (
                <tr key={block.id}
                  style={{ borderBottom: i < blocks.length - 1 ? "1px solid #f8fafc" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <td className="px-6 py-3">
                    <p className="text-sm" style={{ color: "#0f172a" }}>{formatBlockDate(block.start_datetime)}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm" style={{ color: "#0f172a" }}>{formatBlockDate(block.end_datetime)}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm" style={{ color: block.reason ? "#0f172a" : "#cbd5e1" }}>
                      {block.reason || "—"}
                    </p>
                  </td>
                  {locations.length > 0 && (
                    <td className="px-6 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={block.location_id
                          ? { backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }
                          : { backgroundColor: "#f1f5f9", color: "#64748b" }}>
                        {block.location_name || "Todas las sedes"}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDeleteBlock(block.id)} disabled={deletingBlock === block.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fee2e2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}>
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
