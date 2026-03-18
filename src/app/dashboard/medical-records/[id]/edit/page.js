"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const SOAP_SECTIONS = [
  {
    key:         "subjective",
    field:       "soap_subjective",
    letter:      "S",
    title:       "Subjetivo",
    description: "Síntomas referidos por el paciente.",
    placeholder: "El paciente refiere...",
    color:       "#3b82f6",
    bg:          "#eff6ff",
    border:      "#bfdbfe",
  },
  {
    key:         "objective",
    field:       "soap_objective",
    letter:      "O",
    title:       "Objetivo",
    description: "Hallazgos del examen físico.",
    placeholder: "Al examen físico...",
    color:       "#10b981",
    bg:          "#ecfdf5",
    border:      "#a7f3d0",
  },
  {
    key:         "assessment",
    field:       "soap_assessment",
    letter:      "A",
    title:       "Evaluación / Diagnóstico",
    description: "Diagnóstico basado en S y O.",
    placeholder: "Diagnóstico principal...",
    color:       "#f59e0b",
    bg:          "#fffbeb",
    border:      "#fde68a",
    required:    true,
  },
  {
    key:         "plan",
    field:       "soap_plan",
    letter:      "P",
    title:       "Plan",
    description: "Plan terapéutico: medicamentos, indicaciones, seguimiento.",
    placeholder: "Medicamentos: ... Indicaciones: ...",
    color:       "#8b5cf6",
    bg:          "#f5f3ff",
    border:      "#ddd6fe",
  },
];

export default function EditMedicalRecordPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState([]);
  const [form,       setForm]       = useState(null);
  const [record,     setRecord]     = useState(null);

  useEffect(() => { fetchRecord(); }, []);

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/api/v1/medical_records/${id}`);
      setRecord(res.data);
      setForm({
        soap_subjective:          res.data.soap_subjective          || "",
        soap_objective:           res.data.soap_objective           || "",
        soap_assessment:          res.data.soap_assessment          || res.data.diagnosis || "",
        soap_plan:                res.data.soap_plan                || "",
        medications:              res.data.medications              || "",
        notes:                    res.data.notes                    || "",
        next_visit_date:          res.data.next_visit_date          || "",
        weight:                   res.data.weight                   || "",
        height:                   res.data.height                   || "",
        temperature:              res.data.temperature              || "",
        heart_rate:               res.data.heart_rate               || "",
        respiratory_rate:         res.data.respiratory_rate         || "",
        blood_pressure_systolic:  res.data.blood_pressure_systolic  || "",
        blood_pressure_diastolic: res.data.blood_pressure_diastolic || "",
        oxygen_saturation:        res.data.oxygen_saturation        || "",
      });
    } catch {
      toast.error("Error al cargar el expediente");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    if (!form.soap_assessment) {
      setErrors(["El campo A (Evaluación / Diagnóstico) es obligatorio"]);
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/api/v1/medical_records/${id}`, { medical_record: form });
      toast.success("Expediente actualizado correctamente");
      router.push(`/dashboard/medical-records/${id}`);
    } catch (err) {
      const errs = err.response?.data?.errors || ["Error al actualizar el expediente"];
      setErrors(errs);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const lbl = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };

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
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/medical-records/${id}`}>
          <button className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            ← Volver
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
            Editar expediente #{id}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {record?.doctor?.full_name && `Dr. ${record.doctor.full_name}`}
          </p>
        </div>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <div className="px-4 py-3 rounded-lg text-sm space-y-1"
          style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Signos vitales */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
            Signos vitales
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label style={lbl}>Peso (kg)</label>
              <input type="number" step="0.01" placeholder="65.5" style={inp}
                value={form.weight} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Talla (cm)</label>
              <input type="number" step="0.1" placeholder="170" style={inp}
                value={form.height} onChange={(e) => set("height", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Temperatura (°C)</label>
              <input type="number" step="0.1" placeholder="36.6" style={inp}
                value={form.temperature} onChange={(e) => set("temperature", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>SpO₂ (%)</label>
              <input type="number" step="0.1" min="0" max="100" placeholder="98" style={inp}
                value={form.oxygen_saturation} onChange={(e) => set("oxygen_saturation", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Frec. cardíaca (ppm)</label>
              <input type="number" placeholder="72" style={inp}
                value={form.heart_rate} onChange={(e) => set("heart_rate", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Frec. respiratoria (rpm)</label>
              <input type="number" placeholder="16" style={inp}
                value={form.respiratory_rate} onChange={(e) => set("respiratory_rate", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Presión sistólica (mmHg)</label>
              <input type="number" placeholder="120" style={inp}
                value={form.blood_pressure_systolic} onChange={(e) => set("blood_pressure_systolic", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Presión diastólica (mmHg)</label>
              <input type="number" placeholder="80" style={inp}
                value={form.blood_pressure_diastolic} onChange={(e) => set("blood_pressure_diastolic", e.target.value)} />
            </div>
          </div>
        </div>

        {/* SOAP */}
        {SOAP_SECTIONS.map((section) => (
          <div key={section.key} className="rounded-xl p-6"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg"
                style={{ backgroundColor: section.bg, color: section.color, border: `1px solid ${section.border}` }}
              >
                {section.letter}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                  {section.title}
                  {section.required && <span style={{ color: "#ef4444" }}> *</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{section.description}</p>
              </div>
            </div>
            <textarea
              rows={4}
              placeholder={section.placeholder}
              value={form[section.field]}
              onChange={(e) => set(section.field, e.target.value)}
              required={section.required}
              style={{ ...inp, resize: "vertical", lineHeight: "1.6" }}
            />
          </div>
        ))}

        {/* Medicamentos y notas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
              Medicamentos recetados
            </p>
            <textarea
              rows={4}
              placeholder={"Medicamento — dosis — frecuencia — duración\nEj: Ibuprofeno 400mg cada 8h por 5 días"}
              value={form.medications}
              onChange={(e) => set("medications", e.target.value)}
              style={{ ...inp, resize: "none", lineHeight: "1.6" }}
            />
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
              Notas adicionales
            </p>
            <textarea
              rows={3}
              placeholder="Observaciones, indicaciones especiales..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              style={{ ...inp, resize: "none", lineHeight: "1.6" }}
            />
            <div className="mt-4">
              <label style={lbl}>Próxima visita recomendada</label>
              <input type="date" style={inp}
                value={form.next_visit_date} onChange={(e) => set("next_visit_date", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: submitting ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link href={`/dashboard/medical-records/${id}`}>
            <button type="button" className="px-6 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}>
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
