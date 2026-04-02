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

  const [record,  setRecord]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => { fetchRecord(); }, []);

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/api/v1/medical_records/${id}`);
      setRecord(res.data);
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
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Doctor</p>
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
    </div>
  );
}
