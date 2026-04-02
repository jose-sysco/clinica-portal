"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import { useFeature } from "@/lib/useFeature";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const SOAP_SECTIONS = [
  {
    key: "subjective", field: "soap_subjective", letter: "S", title: "Subjetivo",
    description: "Síntomas referidos por el paciente. Motivo de consulta en sus propias palabras.",
    placeholder: "El paciente refiere... Inicio hace X días, característica del síntoma...",
    color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe",
  },
  {
    key: "objective", field: "soap_objective", letter: "O", title: "Objetivo",
    description: "Hallazgos del examen físico. Lo que el clínico observa y mide.",
    placeholder: "Al examen físico... Se observa... Auscultación...",
    color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0",
  },
  {
    key: "assessment", field: "soap_assessment", letter: "A", title: "Evaluación / Diagnóstico",
    description: "Diagnóstico o impresión diagnóstica basada en S y O.",
    placeholder: "Diagnóstico principal... Diagnósticos diferenciales...",
    color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", required: true,
  },
  {
    key: "plan", field: "soap_plan", letter: "P", title: "Plan",
    description: "Plan terapéutico: medicamentos, indicaciones, estudios, seguimiento.",
    placeholder: "Medicamentos: ... Indicaciones: ... Próximo control: ...",
    color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe",
  },
];

const ALL_VITALS = [
  { field: "weight",                   label: "Peso",              unit: "lb",   type: "number", step: "0.01", placeholder: "65.5" },
  { field: "height",                   label: "Talla",             unit: "cm",   type: "number", step: "0.1",  placeholder: "170" },
  { field: "temperature",              label: "Temperatura",       unit: "°C",   type: "number", step: "0.1",  placeholder: "36.6" },
  { field: "oxygen_saturation",        label: "SpO₂",              unit: "%",    type: "number", step: "0.1",  placeholder: "98", min: "0", max: "100" },
  { field: "heart_rate",               label: "Frec. cardíaca",    unit: "ppm",  type: "number", placeholder: "72" },
  { field: "respiratory_rate",         label: "Frec. respiratoria",unit: "rpm",  type: "number", placeholder: "16" },
  { field: "blood_pressure_systolic",  label: "Presión sistólica", unit: "mmHg", type: "number", placeholder: "120" },
  { field: "blood_pressure_diastolic", label: "Presión diastólica",unit: "mmHg", type: "number", placeholder: "80" },
];

const EMPTY_FORM = {
  appointment_id: "",
  // Vitales generales
  weight: "", height: "", temperature: "",
  heart_rate: "", respiratory_rate: "",
  blood_pressure_systolic: "", blood_pressure_diastolic: "",
  oxygen_saturation: "",
  // SOAP
  soap_subjective: "", soap_objective: "", soap_assessment: "", soap_plan: "",
  // General
  medications: "", notes: "", next_visit_date: "",
  // Fisioterapia
  pain_scale: "", affected_area: "", range_of_motion: "",
  functional_assessment: "", treatment_performed: "",
  rehabilitation_plan: "", evolution_notes: "",
  // Odontología
  dental_procedure: "", dental_affected_teeth: "", dental_anesthesia: "",
  // Psicología
  session_number: "", mood_scale: "", psychotherapy_technique: "",
  session_objectives: "", session_development: "", session_agreements: "",
  // Nutrición
  goal_weight: "", dietary_assessment: "", dietary_plan: "",
  food_restrictions: "", physical_activity_level: "",
  // Veterinaria
  coat_condition: "", vaccination_notes: "", deworming_notes: "",
};

export default function NewMedicalRecordPage() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const appointmentId = searchParams.get("appointment_id");
  const { organization } = useAuth();
  const config        = getConfig(organization?.clinic_type);
  const hasInventory  = useFeature("inventory");

  const [appointment,   setAppointment]   = useState(null);
  const [loading,       setLoading]       = useState(!!appointmentId);
  const [submitting,    setSubmitting]    = useState(false);
  const [errors,        setErrors]        = useState([]);
  const [form,          setForm]          = useState({ ...EMPTY_FORM, appointment_id: appointmentId || "" });
  const [scheduleNext,  setScheduleNext]  = useState(false);
  const [nextVisitTime, setNextVisitTime] = useState("");
  const [slots,         setSlots]         = useState([]);
  const [slotsLoading,  setSlotsLoading]  = useState(false);

  // Inventario + medicamentos unificados
  const [usedProducts,   setUsedProducts]   = useState([]);
  const [freeTextMeds,   setFreeTextMeds]   = useState([]);
  const [productSearch,  setProductSearch]  = useState("");
  const [productResults, setProductResults] = useState([]);
  const [searchingProds, setSearchingProds] = useState(false);
  const searchTimeout = useRef(null);
  const doctorHasInventory = appointment?.doctor?.inventory_movements === true;

  useEffect(() => {
    if (appointmentId) fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const res = await api.get(`/api/v1/appointments/${appointmentId}`);
      setAppointment(res.data);
    } catch {
      toast.error("Error al cargar la cita");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    setSlots([]);
    setNextVisitTime("");
    try {
      const res = await api.get(`/api/v1/doctors/${doctorId}/availability`, { params: { date } });
      setSlots(res.data.slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const searchProducts = (q) => {
    setProductSearch(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setProductResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchingProds(true);
      try {
        const res = await api.get("/api/v1/inventory/search", { params: { q } });
        setProductResults(res.data.data || []);
      } catch {} finally { setSearchingProds(false); }
    }, 300);
  };

  const addProduct = (product) => {
    setUsedProducts((prev) => {
      if (prev.find((p) => p.product_id === product.id)) return prev;
      return [...prev, { product_id: product.id, name: product.name, unit: product.unit, quantity: "1", dose: "", frequency: "", duration: "" }];
    });
    setProductSearch("");
    setProductResults([]);
  };

  const removeProduct   = (id)          => setUsedProducts((p) => p.filter((x) => x.product_id !== id));
  const updateProduct   = (id, f, v)    => setUsedProducts((p) => p.map((x) => x.product_id === id ? { ...x, [f]: v } : x));
  const addFreeTextMed  = ()            => setFreeTextMeds((p) => [...p, { id: Date.now(), name: "", dose: "", frequency: "", duration: "" }]);
  const removeFreeTextMed = (id)        => setFreeTextMeds((p) => p.filter((x) => x.id !== id));
  const updateFreeTextMed = (id, f, v)  => setFreeTextMeds((p) => p.map((x) => x.id === id ? { ...x, [f]: v } : x));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    if (config.showSOAP && !form.soap_assessment) {
      setErrors(["El campo A (Evaluación / Diagnóstico) es obligatorio"]);
      return;
    }
    if (scheduleNext && !nextVisitTime) {
      setErrors(["Selecciona un horario disponible para la próxima cita"]);
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (config.showMedications && hasInventory && doctorHasInventory) {
        if (usedProducts.length > 0) {
          payload.used_products = usedProducts.map((p) => ({ product_id: p.product_id, quantity: parseFloat(p.quantity) }));
        }
        const medLines = [
          ...usedProducts.map((p) => {
            let line = p.name;
            if (p.dose)      line += ` ${p.dose}`;
            if (p.frequency) line += ` — ${p.frequency}`;
            if (p.duration)  line += ` por ${p.duration}`;
            return line;
          }),
          ...freeTextMeds.filter((m) => m.name.trim()).map((m) => {
            let line = m.name;
            if (m.dose)      line += ` ${m.dose}`;
            if (m.frequency) line += ` — ${m.frequency}`;
            if (m.duration)  line += ` por ${m.duration}`;
            return line;
          }),
        ];
        payload.medications = medLines.join("\n");
      }
      await api.post("/api/v1/medical_records", { medical_record: payload });

      if (scheduleNext && form.next_visit_date && appointment) {
        const scheduledAt = `${form.next_visit_date}T${nextVisitTime}:00`;
        const newAppt = await api.post("/api/v1/appointments", {
          appointment: {
            doctor_id:        appointment.doctor?.id,
            patient_id:       appointment.patient?.id,
            owner_id:         appointment.owner?.id,
            scheduled_at:     scheduledAt,
            appointment_type: "follow_up",
            reason:           "Control post-consulta",
          },
        });
        toast.success(`${config.recordLabel} guardada y cita de seguimiento agendada`);
        router.push(`/dashboard/appointments/${newAppt.data.id}`);
      } else {
        toast.success(`${config.recordLabel} registrada correctamente`);
        router.push("/dashboard/appointments");
      }
    } catch (err) {
      const errs = err.response?.data?.errors || ["Error al registrar el expediente"];
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
  const card = { backgroundColor: "#ffffff", border: "1px solid #e2e8f0" };

  const visibleVitals = ALL_VITALS.filter((v) => config.showVitals?.includes(v.field));

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
        <Link href="/dashboard/appointments">
          <button className="text-sm px-3 py-1.5 rounded-lg"
            style={{ color: "#64748b", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}>
            ← Volver
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>
            Registrar {config.recordLabel?.toLowerCase()}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {config.businessLabel} — expediente clínico
          </p>
        </div>
      </div>

      {/* Info de la cita */}
      {appointment && (
        <div className="rounded-xl p-5" style={card}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
            Información de la cita
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: config.patientLabel, value: appointment.patient?.name },
              { label: "Doctor",            value: appointment.doctor?.full_name },
              { label: config.ownerLabel,   value: appointment.owner?.full_name },
              { label: "Motivo",            value: appointment.reason },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{label}</p>
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{value}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Errores */}
      {errors.length > 0 && (
        <div className="px-4 py-3 rounded-lg text-sm space-y-1"
          style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Signos Vitales ── */}
        {visibleVitals.length > 0 && (
          <div className="rounded-xl p-6" style={card}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#94a3b8" }}>
              Signos vitales
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {visibleVitals.map(({ field, label, unit, type, step, placeholder, min, max }) => (
                <div key={field}>
                  <label style={lbl}>{label} ({unit})</label>
                  <input
                    type={type} step={step} placeholder={placeholder}
                    min={min} max={max} style={inp}
                    value={form[field]}
                    onChange={(e) => set(field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fisioterapia ── */}
        {config.recordType === "physio" && (
          <div className="rounded-xl p-6 space-y-5" style={card}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Evaluación fisioterapéutica
            </p>

            {/* Escala de dolor + área afectada en la misma fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Escala de dolor (0–10)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="10" step="1"
                    value={form.pain_scale || 0}
                    onChange={(e) => set("pain_scale", e.target.value)}
                    className="flex-1 accent-blue-600" />
                  <span className="text-lg font-bold w-8 text-center"
                    style={{ color: form.pain_scale >= 7 ? "#dc2626" : form.pain_scale >= 4 ? "#f59e0b" : "#16a34a" }}>
                    {form.pain_scale || 0}
                  </span>
                </div>
              </div>
              <div>
                <label style={lbl}>Área afectada</label>
                <input type="text" placeholder="Ej: Hombro derecho, columna lumbar..." style={inp}
                  value={form.affected_area}
                  onChange={(e) => set("affected_area", e.target.value)} />
              </div>
            </div>

            {/* Rango de movimiento */}
            <div>
              <label style={lbl}>Rango de movimiento</label>
              <textarea rows={2} placeholder="Flexión: X°, Extensión: X°, Rotación: ..." style={{ ...inp, resize: "vertical" }}
                value={form.range_of_motion}
                onChange={(e) => set("range_of_motion", e.target.value)} />
            </div>

            {/* Evaluación funcional */}
            <div>
              <label style={lbl}>Evaluación funcional</label>
              <textarea rows={3} placeholder="Capacidad funcional actual, limitaciones, objetivos del tratamiento..."
                style={{ ...inp, resize: "vertical" }}
                value={form.functional_assessment}
                onChange={(e) => set("functional_assessment", e.target.value)} />
            </div>

            {/* Tratamiento realizado */}
            <div>
              <label style={lbl}>Tratamiento realizado en sesión</label>
              <textarea rows={3} placeholder="Técnicas aplicadas, equipos utilizados, tiempo de sesión..."
                style={{ ...inp, resize: "vertical" }}
                value={form.treatment_performed}
                onChange={(e) => set("treatment_performed", e.target.value)} />
            </div>

            {/* Plan de rehabilitación */}
            <div>
              <label style={lbl}>Plan de rehabilitación</label>
              <textarea rows={3} placeholder="Objetivos a corto y largo plazo, frecuencia de sesiones, ejercicios en casa..."
                style={{ ...inp, resize: "vertical" }}
                value={form.rehabilitation_plan}
                onChange={(e) => set("rehabilitation_plan", e.target.value)} />
            </div>

            {/* Notas de evolución */}
            <div>
              <label style={lbl}>Notas de evolución</label>
              <textarea rows={2} placeholder="Respuesta al tratamiento, cambios observados respecto a sesión anterior..."
                style={{ ...inp, resize: "vertical" }}
                value={form.evolution_notes}
                onChange={(e) => set("evolution_notes", e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Odontología ── */}
        {config.recordType === "dental" && (
          <div className="rounded-xl p-6 space-y-4" style={card}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Procedimiento dental
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={lbl}>Procedimiento</label>
                <input type="text" placeholder="Ej: Extracción, Obturación, Limpieza..." style={inp}
                  value={form.dental_procedure}
                  onChange={(e) => set("dental_procedure", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Piezas dentales afectadas</label>
                <input type="text" placeholder="Ej: 1.8, 2.1, 3.6..." style={inp}
                  value={form.dental_affected_teeth}
                  onChange={(e) => set("dental_affected_teeth", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Anestesia utilizada</label>
                <input type="text" placeholder="Ej: Lidocaína 2%, sin anestesia..." style={inp}
                  value={form.dental_anesthesia}
                  onChange={(e) => set("dental_anesthesia", e.target.value)} />
              </div>
            </div>
            {/* SOAP simplificado para dental: solo observaciones y diagnóstico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label style={lbl}>Motivo / Síntomas del paciente</label>
                <textarea rows={3} placeholder="El paciente refiere dolor en..." style={{ ...inp, resize: "vertical" }}
                  value={form.soap_subjective}
                  onChange={(e) => set("soap_subjective", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Diagnóstico</label>
                <textarea rows={3} placeholder="Hallazgos clínicos, diagnóstico..." style={{ ...inp, resize: "vertical" }}
                  value={form.soap_assessment}
                  onChange={(e) => set("soap_assessment", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Psicología ── */}
        {config.recordType === "psychology" && (
          <div className="rounded-xl p-6 space-y-5" style={card}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Registro de sesión
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={lbl}>Número de sesión</label>
                <input type="number" min="1" placeholder="1" style={inp}
                  value={form.session_number}
                  onChange={(e) => set("session_number", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Estado de ánimo (1–10)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="10" step="1"
                    value={form.mood_scale || 5}
                    onChange={(e) => set("mood_scale", e.target.value)}
                    className="flex-1 accent-purple-600" />
                  <span className="text-lg font-bold w-8 text-center" style={{ color: "#8b5cf6" }}>
                    {form.mood_scale || 5}
                  </span>
                </div>
              </div>
              <div>
                <label style={lbl}>Técnica psicoterapéutica</label>
                <input type="text" placeholder="Ej: TCC, EMDR, Mindfulness..." style={inp}
                  value={form.psychotherapy_technique}
                  onChange={(e) => set("psychotherapy_technique", e.target.value)} />
              </div>
            </div>

            <div>
              <label style={lbl}>Objetivos de la sesión</label>
              <textarea rows={2} placeholder="¿Qué se buscó trabajar en esta sesión?..."
                style={{ ...inp, resize: "vertical" }}
                value={form.session_objectives}
                onChange={(e) => set("session_objectives", e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Desarrollo de la sesión</label>
              <textarea rows={4} placeholder="Resumen de lo abordado, intervenciones realizadas, respuesta del paciente..."
                style={{ ...inp, resize: "vertical" }}
                value={form.session_development}
                onChange={(e) => set("session_development", e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Acuerdos y tareas para casa</label>
              <textarea rows={2} placeholder="Compromisos, ejercicios o reflexiones para antes de la próxima sesión..."
                style={{ ...inp, resize: "vertical" }}
                value={form.session_agreements}
                onChange={(e) => set("session_agreements", e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Nutrición ── */}
        {config.recordType === "nutrition" && (
          <div className="rounded-xl p-6 space-y-5" style={card}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Evaluación nutricional
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={lbl}>Peso actual (lb)</label>
                <input type="number" step="0.01" placeholder="65.5" style={inp}
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Talla (cm)</label>
                <input type="number" step="0.1" placeholder="170" style={inp}
                  value={form.height}
                  onChange={(e) => set("height", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Peso meta (lb)</label>
                <input type="number" step="0.01" placeholder="60.0" style={inp}
                  value={form.goal_weight}
                  onChange={(e) => set("goal_weight", e.target.value)} />
              </div>
            </div>

            <div>
              <label style={lbl}>Nivel de actividad física</label>
              <select style={inp}
                value={form.physical_activity_level}
                onChange={(e) => set("physical_activity_level", e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="sedentario">Sedentario</option>
                <option value="ligero">Ligero (1–2 días/semana)</option>
                <option value="moderado">Moderado (3–5 días/semana)</option>
                <option value="activo">Activo (6–7 días/semana)</option>
                <option value="muy_activo">Muy activo (atleta/trabajo físico)</option>
              </select>
            </div>

            <div>
              <label style={lbl}>Evaluación dietética</label>
              <textarea rows={3} placeholder="Hábitos alimenticios actuales, frecuencia de comidas, consumo de agua..."
                style={{ ...inp, resize: "vertical" }}
                value={form.dietary_assessment}
                onChange={(e) => set("dietary_assessment", e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Plan alimenticio</label>
              <textarea rows={4} placeholder="Distribución de macros, plan de comidas, porciones sugeridas..."
                style={{ ...inp, resize: "vertical" }}
                value={form.dietary_plan}
                onChange={(e) => set("dietary_plan", e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Restricciones / alergias alimentarias</label>
              <textarea rows={2} placeholder="Intolerancias, alergias, preferencias (vegano, sin gluten, etc.)..."
                style={{ ...inp, resize: "vertical" }}
                value={form.food_restrictions}
                onChange={(e) => set("food_restrictions", e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Veterinaria — campos adicionales ── */}
        {config.recordType === "veterinary" && (
          <div className="rounded-xl p-6 space-y-4" style={card}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Datos veterinarios
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label style={lbl}>Condición del pelaje / piel</label>
                <input type="text" placeholder="Ej: Brillante, opaco, con dermatitis..." style={inp}
                  value={form.coat_condition}
                  onChange={(e) => set("coat_condition", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Vacunas aplicadas / historial</label>
                <input type="text" placeholder="Ej: Antirrábica, Pentavalente..." style={inp}
                  value={form.vaccination_notes}
                  onChange={(e) => set("vaccination_notes", e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Desparasitación</label>
                <input type="text" placeholder="Ej: Interna y externa aplicada, producto..." style={inp}
                  value={form.deworming_notes}
                  onChange={(e) => set("deworming_notes", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Sesión genérica (beauty / coaching / legal / fitness) ── */}
        {config.recordType === "session" && (
          <div className="rounded-xl p-6 space-y-4" style={card}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
              Registro de {config.recordLabel?.toLowerCase()}
            </p>
            <div>
              <label style={lbl}>Descripción / desarrollo</label>
              <textarea rows={5}
                placeholder={`Describe lo realizado en esta ${config.recordLabel?.toLowerCase() || "sesión"}...`}
                style={{ ...inp, resize: "vertical" }}
                value={form.soap_subjective}
                onChange={(e) => set("soap_subjective", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Resultados / observaciones</label>
              <textarea rows={3} placeholder="Resultados obtenidos, observaciones relevantes..."
                style={{ ...inp, resize: "vertical" }}
                value={form.soap_assessment}
                onChange={(e) => set("soap_assessment", e.target.value)} />
            </div>
          </div>
        )}

        {/* ── SOAP (médico general, pediátrico, veterinario) ── */}
        {config.showSOAP && SOAP_SECTIONS.map((section) => (
          <div key={section.key} className="rounded-xl p-6" style={card}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg"
                style={{ backgroundColor: section.bg, color: section.color, border: `1px solid ${section.border}` }}>
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
              required={section.required && config.showSOAP}
              style={{ ...inp, resize: "vertical", lineHeight: "1.6" }}
            />
          </div>
        ))}

        {/* ── Medicamentos (solo tipos clínicos con showMedications) ── */}
        {config.showMedications && (
          hasInventory && doctorHasInventory ? (
            <div className="rounded-xl p-6 space-y-4" style={card}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                  Medicamentos recetados
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                  Descuenta del inventario al guardar
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar medicamento o insumo del inventario..."
                  value={productSearch}
                  onChange={(e) => searchProducts(e.target.value)}
                  style={inp}
                />
                {(searchingProds || productResults.length > 0) && (
                  <div className="absolute top-full left-0 right-0 z-10 rounded-lg shadow-lg mt-1 overflow-hidden"
                    style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    {searchingProds && (
                      <div className="px-4 py-2 text-sm" style={{ color: "#94a3b8" }}>Buscando...</div>
                    )}
                    {productResults.map((p) => (
                      <button key={p.id} type="button" onClick={() => addProduct(p)}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between"
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}>
                        <span style={{ color: "#0f172a" }}>{p.name}</span>
                        <span className="text-xs" style={{ color: p.current_stock <= 0 ? "#dc2626" : "#94a3b8" }}>
                          Stock: {p.current_stock} {p.unit}
                        </span>
                      </button>
                    ))}
                    {!searchingProds && productResults.length === 0 && productSearch && (
                      <div className="px-4 py-2 text-sm" style={{ color: "#94a3b8" }}>Sin resultados en inventario</div>
                    )}
                  </div>
                )}
              </div>

              {usedProducts.length > 0 && (
                <div className="space-y-3">
                  {usedProducts.map((p) => (
                    <div key={p.product_id} className="rounded-xl p-4 space-y-3"
                      style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-sm font-semibold" style={{ color: "#0f172a" }}>{p.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input type="number" min="0.01" step="0.01" value={p.quantity}
                            onChange={(e) => updateProduct(p.product_id, "quantity", e.target.value)}
                            className="text-sm text-center rounded-lg w-20"
                            style={{ padding: "8px 10px", border: "1px solid #e2e8f0", outline: "none", color: "#0f172a", backgroundColor: "#fff" }} />
                          <span className="text-sm w-14" style={{ color: "#64748b" }}>{p.unit}</span>
                        </div>
                        <button type="button" onClick={() => removeProduct(p.product_id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 text-xs font-bold"
                          style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>✕</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { field: "dose",      placeholder: "Dosis (ej: 500mg)" },
                          { field: "frequency", placeholder: "Frecuencia (ej: cada 8h)" },
                          { field: "duration",  placeholder: "Duración (ej: 7 días)" },
                        ].map(({ field, placeholder }) => (
                          <input key={field} type="text" placeholder={placeholder}
                            value={p[field]} onChange={(e) => updateProduct(p.product_id, field, e.target.value)}
                            className="text-sm rounded-lg w-full"
                            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", outline: "none", color: "#0f172a", backgroundColor: "#fff" }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {freeTextMeds.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#d97706" }}>
                    Sin inventario — no descuenta stock
                  </p>
                  {freeTextMeds.map((m) => (
                    <div key={m.id} className="rounded-xl p-4 space-y-3"
                      style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
                      <div className="flex items-center gap-3">
                        <input type="text" placeholder="Nombre del medicamento"
                          value={m.name} onChange={(e) => updateFreeTextMed(m.id, "name", e.target.value)}
                          className="flex-1 text-sm rounded-lg"
                          style={{ padding: "8px 12px", border: "1px solid #fde68a", outline: "none", color: "#0f172a", backgroundColor: "#fff" }} />
                        <button type="button" onClick={() => removeFreeTextMed(m.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 text-xs font-bold"
                          style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>✕</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { field: "dose",      placeholder: "Dosis" },
                          { field: "frequency", placeholder: "Frecuencia" },
                          { field: "duration",  placeholder: "Duración" },
                        ].map(({ field, placeholder }) => (
                          <input key={field} type="text" placeholder={placeholder}
                            value={m[field]} onChange={(e) => updateFreeTextMed(m.id, field, e.target.value)}
                            className="text-sm rounded-lg w-full"
                            style={{ padding: "8px 12px", border: "1px solid #fde68a", outline: "none", color: "#0f172a", backgroundColor: "#fff" }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {usedProducts.length === 0 && freeTextMeds.length === 0 && (
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Busca un producto del inventario o agrega un medicamento externo.
                </p>
              )}

              <button type="button" onClick={addFreeTextMed}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "#d97706", backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
                + Agregar medicamento sin inventario
              </button>
            </div>
          ) : (
            <div className="rounded-xl p-6" style={card}>
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
          )
        )}

        {/* ── Notas y próxima visita ── */}
        <div className="rounded-xl p-6" style={card}>
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
          <div className="mt-4 space-y-3">
            <div>
              <label style={lbl}>Próxima visita recomendada</label>
              <input
                type="date"
                style={inp}
                value={form.next_visit_date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const date = e.target.value;
                  set("next_visit_date", date);
                  if (!date) {
                    setScheduleNext(false);
                    setSlots([]);
                    setNextVisitTime("");
                  } else if (scheduleNext && appointment?.doctor?.id) {
                    fetchSlots(appointment.doctor.id, date);
                  }
                }}
              />
            </div>

            {form.next_visit_date && appointment && (
              <div className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#15803d" }}>
                      ¿Agendar esta cita ahora?
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#16a34a" }}>
                      Se creará una cita de seguimiento para {appointment.patient?.name} con {appointment.doctor?.full_name}
                    </p>
                  </div>
                  <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid #bbf7d0" }}>
                    {[{ val: true, label: "Sí" }, { val: false, label: "No" }].map(({ val, label }) => (
                      <button key={label} type="button"
                        onClick={() => {
                          setScheduleNext(val);
                          if (val && form.next_visit_date && appointment?.doctor?.id) {
                            fetchSlots(appointment.doctor.id, form.next_visit_date);
                          }
                          if (!val) { setSlots([]); setNextVisitTime(""); }
                        }}
                        className="px-4 py-1.5 text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: scheduleNext === val ? "#16a34a" : "#ffffff",
                          color:           scheduleNext === val ? "#ffffff" : "#64748b",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {scheduleNext && (
                  <div className="pt-1 space-y-2">
                    <label style={{ ...lbl, color: "#15803d" }}>Horario disponible</label>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs" style={{ color: "#16a34a" }}>Cargando horarios...</span>
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        No hay horarios disponibles para esta fecha.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((slot, i) => (
                          <button key={i} type="button"
                            onClick={() => setNextVisitTime(slot.starts_at)}
                            className="py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              backgroundColor: nextVisitTime === slot.starts_at ? "#16a34a" : "#ffffff",
                              color:           nextVisitTime === slot.starts_at ? "#ffffff" : "#16a34a",
                              border:          `1px solid ${nextVisitTime === slot.starts_at ? "#16a34a" : "#bbf7d0"}`,
                            }}>
                            {slot.starts_at}
                          </button>
                        ))}
                      </div>
                    )}
                    {nextVisitTime && (
                      <div className="rounded-lg px-3 py-2 text-xs inline-block"
                        style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
                        {new Date(`${form.next_visit_date}T${nextVisitTime}`).toLocaleDateString("es-GT", {
                          weekday: "short", day: "numeric", month: "short",
                        })}{" "}· {nextVisitTime}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: submitting ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting
              ? "Guardando..."
              : scheduleNext
                ? `Guardar ${config.recordLabel?.toLowerCase()} y agendar cita →`
                : `Guardar ${config.recordLabel?.toLowerCase()}`}
          </button>
          <Link href="/dashboard/appointments">
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
