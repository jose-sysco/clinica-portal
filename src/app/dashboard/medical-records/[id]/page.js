"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import dynamic from "next/dynamic";

const DownloadMedicalRecordPDF = dynamic(
  () => import("@/components/MedicalRecordPDF"),
  { ssr: false }
);

const SOAP_SECTIONS = [
  { field: "soap_subjective", letter: "S", title: "Subjetivo",               color: "#3b82f6", bg: "#eff6ff",  border: "#bfdbfe" },
  { field: "soap_objective",  letter: "O", title: "Objetivo",                color: "#10b981", bg: "#ecfdf5",  border: "#a7f3d0" },
  { field: "soap_assessment", letter: "A", title: "Evaluación / Diagnóstico",color: "#f59e0b", bg: "#fffbeb",  border: "#fde68a" },
  { field: "soap_plan",       letter: "P", title: "Plan",                    color: "#8b5cf6", bg: "#f5f3ff",  border: "#ddd6fe" },
];

const VITALS = [
  { field: "weight",                   label: "Peso",          unit: "lb",   icon: "⚖" },
  { field: "height",                   label: "Talla",         unit: "cm",   icon: "↕" },
  { field: "temperature",              label: "Temperatura",   unit: "°C",   icon: "🌡" },
  { field: "oxygen_saturation",        label: "SpO₂",          unit: "%",    icon: "◎" },
  { field: "heart_rate",               label: "Frec. cardíaca",unit: "ppm",  icon: "♥" },
  { field: "respiratory_rate",         label: "Frec. resp.",   unit: "rpm",  icon: "~" },
  { field: "blood_pressure_systolic",  label: "Presión sist.", unit: "mmHg", icon: "↑" },
  { field: "blood_pressure_diastolic", label: "Presión diast.",unit: "mmHg", icon: "↓" },
];

export default function MedicalRecordDetailPage() {
  const { id }          = useParams();
  const { organization } = useAuth();
  const config           = getConfig(organization?.clinic_type);

  const [record,       setRecord]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [attachments,    setAttachments]    = useState([]);
  const [uploading,      setUploading]      = useState(false);
  const [deleting,       setDeleting]       = useState(null);
  const [prescriptions,  setPrescriptions]  = useState([]);
  const [showRxForm,     setShowRxForm]     = useState(false);
  const [savingRx,       setSavingRx]       = useState(false);

  useEffect(() => { fetchRecord(); fetchPrescriptions(); }, []);

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/api/v1/medical_records/${id}`);
      setRecord(res.data);
      fetchAttachments();
    } catch {
      setError("Error al cargar el expediente");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    // Fechas YYYY-MM-DD sin hora → parsear como local para evitar desfase UTC
    const date = typeof d === "string" && d.length === 10 ? new Date(d + "T00:00:00") : new Date(d);
    return date.toLocaleDateString("es-GT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  // Detecta qué secciones tiene el registro (todo basado en datos, no en config)
  const isSoap    = SOAP_SECTIONS.some((s) => record?.[s.field]);
  const hasVitals = VITALS.some((v) => record?.[v.field] != null && record?.[v.field] !== "");
  const hasPhysio = ["pain_scale", "affected_area", "treatment_performed", "rehabilitation_plan", "evolution_notes"].some((f) => record?.[f] != null && record?.[f] !== "");
  const hasDental = ["dental_procedure", "dental_affected_teeth", "dental_anesthesia"].some((f) => record?.[f]);
  const hasPsychology = ["session_development", "session_objectives", "session_agreements", "session_number", "mood_scale", "psychotherapy_technique"].some((f) => record?.[f] != null && record?.[f] !== "");
  const hasNutrition = ["dietary_plan", "dietary_assessment", "food_restrictions", "physical_activity_level", "goal_weight"].some((f) => record?.[f] != null && record?.[f] !== "");
  const hasVetExtra  = ["coat_condition", "vaccination_notes", "deworming_notes"].some((f) => record?.[f]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => window.history.back()}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            ← Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
              Expediente clínico
            </h1>
            <p className="text-sm mt-0.5 capitalize" style={{ color: "#64748b" }}>
              {formatDate(record?.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DownloadMedicalRecordPDF record={record} organization={organization} config={config} />
          <Link href={`/dashboard/medical-records/${record?.id}/edit`}>
            <button
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              Editar
            </button>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <span className="text-sm font-bold" style={{ color: "#2563eb" }}>Rx</span>
            <span className="text-xs" style={{ color: "#2563eb" }}>#{record?.id}</span>
          </div>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Doctor */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>{config.staffSingularLabel}</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#eff6ff" }}>
              <span className="text-xs font-bold" style={{ color: "#2563eb" }}>
                {record?.doctor?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{record?.doctor?.full_name}</p>
          </div>
        </div>

        {/* Paciente */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>{config.patientLabel}</p>
          <Link href={`/dashboard/patients/${record?.patient_id}/records`}>
            <p className="text-sm font-medium hover:underline" style={{ color: "#2563eb", cursor: "pointer" }}>
              Ver historial completo →
            </p>
          </Link>
        </div>

        {/* Próxima visita */}
        <div className="rounded-xl p-5"
          style={{ backgroundColor: record?.next_visit_date ? "#eff6ff" : "#ffffff", border: `1px solid ${record?.next_visit_date ? "#bfdbfe" : "#e2e8f0"}` }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Próxima visita</p>
          <p className="text-sm font-medium capitalize"
            style={{ color: record?.next_visit_date ? "#2563eb" : "#94a3b8" }}>
            {record?.next_visit_date ? formatDate(record.next_visit_date) : "No programada"}
          </p>
        </div>
      </div>

      {/* Signos vitales */}
      {hasVitals && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
            Signos vitales
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VITALS.map(({ field, label, unit, icon }) => {
              const value = record?.[field];
              if (value == null || value === "") return null;
              return (
                <div key={field} className="rounded-xl p-4 text-center"
                  style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <p className="text-lg mb-1">{icon}</p>
                  <p className="text-xl font-bold" style={{ color: "#0f172a" }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{unit}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: "#64748b" }}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Fisioterapia ── */}
      {hasPhysio && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
            Evaluación fisioterapéutica
          </p>
          <div className="space-y-4">
            {record?.pain_scale != null && record?.pain_scale !== "" && (
              <div className="flex items-center gap-4">
                <p className="text-xs font-medium w-36 flex-shrink-0" style={{ color: "#64748b" }}>Escala de dolor</p>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#e2e8f0" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${(record.pain_scale / 10) * 100}%`,
                        backgroundColor: record.pain_scale >= 7 ? "#dc2626" : record.pain_scale >= 4 ? "#f59e0b" : "#16a34a",
                      }} />
                  </div>
                  <span className="text-sm font-bold"
                    style={{ color: record.pain_scale >= 7 ? "#dc2626" : record.pain_scale >= 4 ? "#f59e0b" : "#16a34a" }}>
                    {record.pain_scale}/10
                  </span>
                </div>
              </div>
            )}
            {[
              { field: "affected_area",       label: "Área afectada" },
              { field: "range_of_motion",     label: "Rango de movimiento" },
              { field: "functional_assessment",label: "Evaluación funcional" },
              { field: "treatment_performed", label: "Tratamiento realizado" },
              { field: "rehabilitation_plan", label: "Plan de rehabilitación" },
              { field: "evolution_notes",     label: "Notas de evolución" },
            ].map(({ field, label }) => record?.[field] ? (
              <div key={field}>
                <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{label}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#0f172a" }}>{record[field]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ── Odontología ── */}
      {hasDental && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
            Procedimiento dental
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { field: "dental_procedure",      label: "Procedimiento" },
              { field: "dental_affected_teeth", label: "Piezas afectadas" },
              { field: "dental_anesthesia",     label: "Anestesia" },
            ].map(({ field, label }) => record?.[field] ? (
              <div key={field}>
                <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{record[field]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ── Psicología ── */}
      {hasPsychology && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
            Registro de sesión
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-6 flex-wrap">
              {record?.session_number && (
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Sesión #</p>
                  <p className="text-xl font-bold" style={{ color: "#8b5cf6" }}>{record.session_number}</p>
                </div>
              )}
              {record?.mood_scale != null && record?.mood_scale !== "" && (
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Estado de ánimo</p>
                  <p className="text-xl font-bold" style={{ color: "#8b5cf6" }}>{record.mood_scale}/10</p>
                </div>
              )}
              {record?.psychotherapy_technique && (
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Técnica</p>
                  <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{record.psychotherapy_technique}</p>
                </div>
              )}
            </div>
            {[
              { field: "session_objectives",  label: "Objetivos de la sesión" },
              { field: "session_development", label: "Desarrollo de la sesión" },
              { field: "session_agreements",  label: "Acuerdos y tareas para casa" },
            ].map(({ field, label }) => record?.[field] ? (
              <div key={field}>
                <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{label}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#0f172a" }}>{record[field]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ── Nutrición ── */}
      {hasNutrition && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
            Evaluación nutricional
          </p>
          <div className="space-y-4">
            {(record?.goal_weight || record?.physical_activity_level) && (
              <div className="flex items-center gap-6 flex-wrap">
                {record?.goal_weight && (
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Peso meta</p>
                    <p className="text-xl font-bold" style={{ color: "#10b981" }}>{record.goal_weight} lb</p>
                  </div>
                )}
                {record?.physical_activity_level && (
                  <div>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "#64748b" }}>Actividad física</p>
                    <p className="text-sm font-medium capitalize" style={{ color: "#0f172a" }}>
                      {record.physical_activity_level.replace("_", " ")}
                    </p>
                  </div>
                )}
              </div>
            )}
            {[
              { field: "dietary_assessment", label: "Evaluación dietética" },
              { field: "dietary_plan",       label: "Plan alimenticio" },
              { field: "food_restrictions",  label: "Restricciones / alergias" },
            ].map(({ field, label }) => record?.[field] ? (
              <div key={field}>
                <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{label}</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#0f172a" }}>{record[field]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ── Veterinaria (campos extra) ── */}
      {hasVetExtra && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
            Datos veterinarios
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { field: "coat_condition",    label: "Condición del pelaje" },
              { field: "vaccination_notes", label: "Vacunas" },
              { field: "deworming_notes",   label: "Desparasitación" },
            ].map(({ field, label }) => record?.[field] ? (
              <div key={field}>
                <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{label}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#0f172a" }}>{record[field]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ── SOAP ── */}
      {isSoap && (
        <div className="space-y-4">
          {SOAP_SECTIONS.map((section) => {
            const content = record?.[section.field];
            if (!content) return null;
            return (
              <div key={section.field} className="rounded-xl p-6"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-base"
                    style={{ backgroundColor: section.bg, color: section.color, border: `1px solid ${section.border}` }}>
                    {section.letter}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{section.title}</p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#334155" }}>
                  {content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Formato legacy (registros anteriores al rediseño SOAP) ── */}
      {!isSoap && !hasPhysio && !hasPsychology && !hasNutrition && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {record?.diagnosis && (
            <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Diagnóstico</p>
              <p className="text-sm leading-relaxed" style={{ color: "#0f172a" }}>{record.diagnosis}</p>
            </div>
          )}
          {record?.treatment && (
            <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Tratamiento</p>
              <p className="text-sm leading-relaxed" style={{ color: "#0f172a" }}>{record.treatment}</p>
            </div>
          )}
        </div>
      )}

      {/* Medicamentos */}
      {record?.medications && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
            Medicamentos recetados
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#0f172a" }}>{record.medications}</p>
        </div>
      )}

      {/* Notas */}
      {record?.notes && (
        <div className="rounded-xl p-6" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#92400e" }}>Notas adicionales</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#78350f" }}>{record.notes}</p>
        </div>
      )}

      {/* Adjuntos */}
      <AttachmentsSection
        recordId={id}
        attachments={attachments}
        uploading={uploading}
        deleting={deleting}
        onUpload={handleUpload}
        onDelete={handleDeleteAttachment}
      />

      {/* Recetas electrónicas */}
      <PrescriptionsSection
        record={record}
        prescriptions={prescriptions}
        showForm={showRxForm}
        saving={savingRx}
        onToggleForm={() => setShowRxForm((v) => !v)}
        onSave={handleSaveRx}
        onRevoke={handleRevokeRx}
        onDownload={handleDownloadRx}
      />
    </div>
  );

  function fetchAttachments() {
    api.get(`/api/v1/medical_records/${id}/attachments`)
      .then((r) => setAttachments(r.data))
      .catch(() => {});
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (attachments.length + files.length > 5) {
      import("sonner").then(({ toast }) => toast.error("Máximo 5 archivos por expediente"));
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files[]", f));
      const res = await api.post(`/api/v1/medical_records/${id}/attachments`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAttachments(res.data);
    } catch (err) {
      import("sonner").then(({ toast }) =>
        toast.error(err.response?.data?.error || "Error al subir archivo")
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteAttachment(attachId) {
    setDeleting(attachId);
    try {
      await api.delete(`/api/v1/medical_records/${id}/attachments/${attachId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachId));
    } catch {
      import("sonner").then(({ toast }) => toast.error("Error al eliminar"));
    } finally {
      setDeleting(null);
    }
  }

  function fetchPrescriptions() {
    api.get(`/api/v1/prescriptions?medical_record_id=${id}`)
      .then((r) => setPrescriptions(r.data))
      .catch(() => {});
  }

  async function handleSaveRx(rxData) {
    setSavingRx(true);
    try {
      const res = await api.post("/api/v1/prescriptions", {
        prescription: {
          ...rxData,
          patient_id:        record.patient_id,
          appointment_id:    record.appointment_id,
          medical_record_id: record.id,
        },
      });
      setPrescriptions((prev) => [res.data, ...prev]);
      setShowRxForm(false);
      import("sonner").then(({ toast }) => toast.success("Receta creada"));
    } catch (err) {
      const msg = err.response?.data?.errors?.[0] || "Error al crear receta";
      import("sonner").then(({ toast }) => toast.error(msg));
    } finally {
      setSavingRx(false);
    }
  }

  async function handleRevokeRx(rxId) {
    try {
      await api.patch(`/api/v1/prescriptions/${rxId}/revoke`);
      setPrescriptions((prev) =>
        prev.map((p) => (p.id === rxId ? { ...p, status: "revoked" } : p))
      );
      import("sonner").then(({ toast }) => toast.success("Receta revocada"));
    } catch {
      import("sonner").then(({ toast }) => toast.error("Error al revocar"));
    }
  }

  async function handleDownloadRx(rxId) {
    try {
      const token = (await import("js-cookie")).default.get("token");
      const slug  = (await import("js-cookie")).default.get("organization_slug");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";
      const res = await fetch(`${apiUrl}/api/v1/prescriptions/${rxId}/download`, {
        headers: { Authorization: `Bearer ${token}`, "X-Organization-Slug": slug },
      });
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.target   = "_blank";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      import("sonner").then(({ toast }) => toast.error("Error al descargar PDF"));
    }
  }
}

function AttachmentsSection({ recordId, attachments, uploading, deleting, onUpload, onDelete }) {
  const isPDF = (ct) => ct === "application/pdf";

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
          Adjuntos
          {attachments.length > 0 && (
            <span className="ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
              {attachments.length}/5
            </span>
          )}
        </p>
        {attachments.length < 5 && (
          <label className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ backgroundColor: uploading ? "#f1f5f9" : "#eff6ff", color: uploading ? "#94a3b8" : "#2563eb", border: "1px solid #bfdbfe" }}>
            {uploading ? "Subiendo…" : "+ Agregar"}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: "none" }} onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="p-4" style={{ backgroundColor: "#ffffff" }}>
        {attachments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "#cbd5e1" }}>
            Sin adjuntos — agrega imágenes (JPG, PNG, WebP) o PDFs
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attachments.map((a) => (
              <div key={a.id} className="rounded-xl overflow-hidden relative group"
                style={{ border: "1px solid #e2e8f0" }}>
                {isPDF(a.content_type) ? (
                  <a href={a.url} target="_blank" rel="noreferrer"
                    className="flex flex-col items-center justify-center p-4 gap-2"
                    style={{ backgroundColor: "#fef2f2", minHeight: "100px" }}>
                    <span style={{ fontSize: "28px" }}>📄</span>
                    <span className="text-xs font-medium text-center truncate w-full" style={{ color: "#dc2626" }}>
                      {a.filename}
                    </span>
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{fmtSize(a.byte_size)}</span>
                  </a>
                ) : (
                  <a href={a.url} target="_blank" rel="noreferrer">
                    <img src={a.url} alt={a.filename}
                      className="w-full object-cover"
                      style={{ maxHeight: "140px" }} />
                  </a>
                )}
                <button onClick={() => onDelete(a.id)} disabled={deleting === a.id}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "rgba(220,38,38,0.9)", color: "#fff" }}>
                  {deleting === a.id ? "…" : "✕"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recetas electrónicas ──────────────────────────────────────────────────────

const EMPTY_MED = { name: "", dose: "", frequency: "", duration: "", instructions: "" };

function PrescriptionsSection({ record, prescriptions, showForm, saving, onToggleForm, onSave, onRevoke, onDownload }) {
  const [form, setForm] = useState({ diagnosis: record?.diagnosis || "", notes: "", valid_until: "", medications: [{ ...EMPTY_MED }] });

  const addMed   = () => setForm((f) => ({ ...f, medications: [...f.medications, { ...EMPTY_MED }] }));
  const removeMed = (i) => setForm((f) => ({ ...f, medications: f.medications.filter((_, idx) => idx !== i) }));
  const updateMed = (i, field, val) =>
    setForm((f) => ({ ...f, medications: f.medications.map((m, idx) => idx === i ? { ...m, [field]: val } : m) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const meds = form.medications.filter((m) => m.name.trim());
    if (!meds.length) {
      import("sonner").then(({ toast }) => toast.error("Agrega al menos un medicamento"));
      return;
    }
    onSave({ ...form, medications: meds });
  };

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Recetas electrónicas</p>
          {prescriptions.length > 0 && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
              {prescriptions.length}
            </span>
          )}
        </div>
        <button onClick={onToggleForm}
          className="text-xs font-medium px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: showForm ? "#f1f5f9" : "#eff6ff", color: showForm ? "#94a3b8" : "#2563eb", border: "1px solid #bfdbfe" }}>
          {showForm ? "Cancelar" : "+ Nueva receta"}
        </button>
      </div>

      <div className="p-5" style={{ backgroundColor: "#ffffff" }}>
        {/* New Rx form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-5 space-y-4 p-4 rounded-xl"
            style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748b" }}>Nueva receta</p>

            {/* Diagnosis + valid_until */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#64748b" }}>Diagnóstico</label>
                <input type="text" value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  placeholder="Ej. Faringitis aguda"
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#64748b" }}>Válida hasta</label>
                <input type="date" value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" }} />
              </div>
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#64748b" }}>Medicamentos *</label>
                <button type="button" onClick={addMed}
                  className="text-xs font-medium px-2 py-1 rounded-lg"
                  style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                  + Agregar
                </button>
              </div>
              <div className="space-y-3">
                {form.medications.map((med, i) => (
                  <div key={i} className="p-3 rounded-lg relative" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    {form.medications.length > 1 && (
                      <button type="button" onClick={() => removeMed(i)}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>✕</button>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="col-span-2">
                        <input type="text" value={med.name} placeholder="Nombre del medicamento *"
                          onChange={(e) => updateMed(i, "name", e.target.value)}
                          className="w-full text-sm px-3 py-1.5 rounded-lg outline-none"
                          style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                      </div>
                      <input type="text" value={med.dose} placeholder="Dosis (ej. 500mg)"
                        onChange={(e) => updateMed(i, "dose", e.target.value)}
                        className="text-sm px-3 py-1.5 rounded-lg outline-none"
                        style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                      <input type="text" value={med.frequency} placeholder="Frecuencia (ej. cada 8h)"
                        onChange={(e) => updateMed(i, "frequency", e.target.value)}
                        className="text-sm px-3 py-1.5 rounded-lg outline-none"
                        style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                      <input type="text" value={med.duration} placeholder="Duración (ej. 7 días)"
                        onChange={(e) => updateMed(i, "duration", e.target.value)}
                        className="text-sm px-3 py-1.5 rounded-lg outline-none"
                        style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                      <input type="text" value={med.instructions} placeholder="Indicaciones especiales"
                        onChange={(e) => updateMed(i, "instructions", e.target.value)}
                        className="text-sm px-3 py-1.5 rounded-lg outline-none"
                        style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#64748b" }}>Indicaciones generales</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Reposo, hidratación, regresar si…"
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", resize: "vertical" }} />
            </div>

            <button type="submit" disabled={saving}
              className="text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
              {saving ? "Guardando…" : "Emitir receta"}
            </button>
          </form>
        )}

        {/* Prescriptions list */}
        {prescriptions.length === 0 && !showForm ? (
          <p className="text-sm text-center py-4" style={{ color: "#cbd5e1" }}>
            Sin recetas — emite la primera receta electrónica de este expediente
          </p>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="rounded-xl p-4"
                style={{ border: `1px solid ${rx.status === "revoked" ? "#fecaca" : "#e2e8f0"}`, backgroundColor: rx.status === "revoked" ? "#fef2f2" : "#f8fafc" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: rx.status === "revoked" ? "#fee2e2" : "#eff6ff", color: rx.status === "revoked" ? "#dc2626" : "#2563eb", border: `1px solid ${rx.status === "revoked" ? "#fecaca" : "#bfdbfe"}` }}>
                        {rx.status === "revoked" ? "Revocada" : "Válida"}
                      </span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{fmtDate(rx.issued_at)}</span>
                      {rx.diagnosis && (
                        <span className="text-xs truncate" style={{ color: "#64748b" }}>— {rx.diagnosis}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rx.medications?.slice(0, 4).map((m, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#f1f5f9", color: "#374151" }}>
                          {m.name}{m.dose ? ` ${m.dose}` : ""}
                        </span>
                      ))}
                      {(rx.medications?.length || 0) > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f1f5f9", color: "#94a3b8" }}>
                          +{rx.medications.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => onDownload(rx.id)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}
                      title="Descargar PDF">
                      PDF ↓
                    </button>
                    <a href={rx.public_url} target="_blank" rel="noreferrer"
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                      style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                      title="Ver receta pública">
                      QR ↗
                    </a>
                    {rx.status !== "revoked" && (
                      <button onClick={() => onRevoke(rx.id)}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                        style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                        title="Revocar receta">
                        Revocar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
