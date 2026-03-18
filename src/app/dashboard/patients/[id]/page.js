"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

const GENDER_LABEL = { male: "Masculino", female: "Femenino", unknown: "No especificado" };
const ANIMAL_GENDER_LABEL = { male: "Macho", female: "Hembra", unknown: "No especificado" };
const REPRO_LABEL = { intact: "Íntegro/a", neutered: "Castrado/a", spayed: "Esterilizada" };

export default function PatientProfilePage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { organization } = useAuth();
  const config   = getConfig(organization?.clinic_type);

  const [patient,       setPatient]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [form,          setForm]          = useState({});
  const [weightRecords, setWeightRecords] = useState([]);
  const [newWeight,     setNewWeight]     = useState("");
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [addingWeight,  setAddingWeight]  = useState(false);

  useEffect(() => { fetchPatient(); fetchWeightHistory(); }, []);

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/api/v1/patients/${id}`);
      setPatient(res.data);
      setForm(res.data);
    } catch {
      toast.error("Error al cargar el paciente");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeightHistory = async () => {
    try {
      const res = await api.get(`/api/v1/patients/${id}/weight_records`);
      setWeightRecords(res.data);
    } catch {}
  };

  const handleAddWeight = async () => {
    if (!newWeight) return;
    setAddingWeight(true);
    try {
      await api.post(`/api/v1/patients/${id}/weight_records`, {
        weight_record: { weight: newWeight, recorded_on: newWeightDate },
      });
      setNewWeight("");
      fetchWeightHistory();
      toast.success("Peso registrado");
    } catch {
      toast.error("Error al registrar peso");
    } finally {
      setAddingWeight(false);
    }
  };

  const handleDeleteWeight = async (wid) => {
    try {
      await api.delete(`/api/v1/patients/${id}/weight_records/${wid}`);
      setWeightRecords((prev) => prev.filter((r) => r.id !== wid));
    } catch {
      toast.error("Error al eliminar registro");
    }
  };

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/api/v1/patients/${id}`, { patient: form });
      setPatient(res.data);
      setForm(res.data);
      setEditing(false);
      toast.success("Paciente actualizado");
    } catch (err) {
      const errs = err.response?.data?.errors || ["Error al guardar"];
      toast.error(errs[0]);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString("es-GT", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const inp = {
    width: "100%", padding: "8px 12px", fontSize: "14px",
    border: "1px solid #e2e8f0", borderRadius: "8px",
    outline: "none", backgroundColor: "#ffffff", color: "#0f172a",
  };
  const lbl = { display: "block", fontSize: "12px", fontWeight: "500", color: "#94a3b8", marginBottom: "4px" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) return null;

  const genderLabel = config.showAnimalGender
    ? ANIMAL_GENDER_LABEL[patient.gender]
    : GENDER_LABEL[patient.gender];

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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#eff6ff" }}>
              <span className="text-lg font-bold" style={{ color: "#2563eb" }}>{patient.name[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>{patient.name}</h1>
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                {config.patientLabel}
                {patient.age != null && ` · ${patient.age} años`}
                {patient.species && ` · ${patient.species}`}
                {patient.breed && ` (${patient.breed})`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/patients/${id}/records`}>
            <button
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}
            >
              Ver expedientes →
            </button>
          </Link>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#2563eb", color: "#ffffff", cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                onClick={() => { setEditing(false); setForm(patient); }}
                className="text-sm font-medium px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#ffffff", color: "#64748b", border: "1px solid #e2e8f0" }}
            >
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Datos básicos */}
        <div className="col-span-2 rounded-xl p-6 space-y-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Datos del {config.patientLabel.toLowerCase()}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={lbl}>Nombre completo</label>
              {editing ? (
                <input type="text" value={form.name || ""} onChange={(e) => set("name", e.target.value)} style={inp} />
              ) : (
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{patient.name}</p>
              )}
            </div>

            <div>
              <label style={lbl}>{config.showAnimalGender ? "Sexo" : "Género"}</label>
              {editing ? (
                <select value={form.gender || "unknown"} onChange={(e) => set("gender", e.target.value)} style={inp}>
                  <option value="unknown">No especificado</option>
                  <option value="male">{config.showAnimalGender ? "Macho" : "Masculino"}</option>
                  <option value="female">{config.showAnimalGender ? "Hembra" : "Femenino"}</option>
                </select>
              ) : (
                <p className="text-sm" style={{ color: "#0f172a" }}>{genderLabel}</p>
              )}
            </div>

            <div>
              <label style={lbl}>Fecha de nacimiento</label>
              {editing ? (
                <input type="date" value={form.birthdate || ""} onChange={(e) => set("birthdate", e.target.value)} style={inp} />
              ) : (
                <p className="text-sm" style={{ color: "#0f172a" }}>{formatDate(patient.birthdate)}</p>
              )}
            </div>

            <div>
              <label style={lbl}>Peso (kg)</label>
              {editing ? (
                <input type="number" step="0.01" value={form.weight || ""} onChange={(e) => set("weight", e.target.value)} style={inp} />
              ) : (
                <p className="text-sm" style={{ color: "#0f172a" }}>
                  {patient.weight ? `${patient.weight} kg` : "—"}
                </p>
              )}
            </div>

            {config.showSpecies && (
              <div>
                <label style={lbl}>Especie</label>
                {editing ? (
                  <input type="text" value={form.species || ""} onChange={(e) => set("species", e.target.value)} style={inp} />
                ) : (
                  <p className="text-sm" style={{ color: "#0f172a" }}>{patient.species || "—"}</p>
                )}
              </div>
            )}

            {config.showBreed && (
              <div>
                <label style={lbl}>Raza</label>
                {editing ? (
                  <input type="text" value={form.breed || ""} onChange={(e) => set("breed", e.target.value)} style={inp} />
                ) : (
                  <p className="text-sm" style={{ color: "#0f172a" }}>{patient.breed || "—"}</p>
                )}
              </div>
            )}

            {config.showBloodType && (
              <div>
                <label style={lbl}>Tipo de sangre</label>
                {editing ? (
                  <select value={form.blood_type || ""} onChange={(e) => set("blood_type", e.target.value)} style={inp}>
                    <option value="">No especificado</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold" style={{ color: patient.blood_type ? "#dc2626" : "#94a3b8" }}>
                    {patient.blood_type || "—"}
                  </p>
                )}
              </div>
            )}

            {config.showMicrochip && (
              <div>
                <label style={lbl}>Microchip</label>
                {editing ? (
                  <input type="text" value={form.microchip_number || ""} onChange={(e) => set("microchip_number", e.target.value)} style={inp} placeholder="985112345678901" />
                ) : (
                  <p className="text-sm font-mono" style={{ color: "#0f172a" }}>{patient.microchip_number || "—"}</p>
                )}
              </div>
            )}

            {config.showReproductiveStatus && (
              <div>
                <label style={lbl}>Estado reproductivo</label>
                {editing ? (
                  <select value={form.reproductive_status || ""} onChange={(e) => set("reproductive_status", e.target.value)} style={inp}>
                    <option value="">No especificado</option>
                    <option value="intact">Íntegro/a</option>
                    <option value="neutered">Castrado/a</option>
                    <option value="spayed">Esterilizada</option>
                  </select>
                ) : (
                  <p className="text-sm" style={{ color: "#0f172a" }}>
                    {REPRO_LABEL[patient.reproductive_status] || "—"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Alergias */}
          {config.showAllergies && (
            <div>
              <label style={lbl}>Alergias conocidas</label>
              {editing ? (
                <textarea
                  rows={3}
                  value={form.allergies || ""}
                  onChange={(e) => set("allergies", e.target.value)}
                  placeholder="Penicilina, látex, mariscos..."
                  style={{ ...inp, resize: "vertical" }}
                />
              ) : patient.allergies ? (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{ backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}
                >
                  ⚠ {patient.allergies}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#94a3b8" }}>Sin alergias registradas</p>
              )}
            </div>
          )}

          {/* Condiciones crónicas */}
          {config.showChronicConditions && (
            <div>
              <label style={lbl}>Condiciones crónicas</label>
              {editing ? (
                <textarea
                  rows={3}
                  value={form.chronic_conditions || ""}
                  onChange={(e) => set("chronic_conditions", e.target.value)}
                  placeholder="Diabetes, hipertensión, asma..."
                  style={{ ...inp, resize: "vertical" }}
                />
              ) : patient.chronic_conditions ? (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{ backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}
                >
                  {patient.chronic_conditions}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "#94a3b8" }}>Sin condiciones crónicas registradas</p>
              )}
            </div>
          )}

          {/* Notas */}
          <div>
            <label style={lbl}>Notas adicionales</label>
            {editing ? (
              <textarea
                rows={3}
                value={form.notes || ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Observaciones generales..."
                style={{ ...inp, resize: "vertical" }}
              />
            ) : patient.notes ? (
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{patient.notes}</p>
            ) : (
              <p className="text-sm" style={{ color: "#94a3b8" }}>—</p>
            )}
          </div>
        </div>

        {/* Columna derecha — Responsable + accesos rápidos */}
        <div className="space-y-4">
          {/* Responsable */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
              {config.ownerLabel}
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f1f5f9" }}>
                <span className="text-xs font-bold" style={{ color: "#64748b" }}>
                  {patient.owner?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "#0f172a" }}>{patient.owner?.full_name}</p>
                <p className="text-xs" style={{ color: "#64748b" }}>{patient.owner?.phone}</p>
              </div>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="rounded-xl p-5 space-y-2" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Acciones</p>
            <Link href={`/dashboard/patients/${id}/records`}>
              <button
                className="w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors"
                style={{ color: "#7c3aed", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe" }}
              >
                📋 Ver historial clínico
              </button>
            </Link>
            <Link href={`/dashboard/appointments/new?patient_id=${id}`}>
              <button
                className="w-full text-left text-sm px-3 py-2.5 rounded-lg mt-2 transition-colors"
                style={{ color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
              >
                + Nueva cita
              </button>
            </Link>
          </div>

          {/* Historial de peso */}
          <div className="rounded-xl p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
              Historial de peso
            </p>

            {/* Agregar registro */}
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                step="0.01"
                placeholder="kg"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-20 text-sm px-2 py-1.5 rounded-lg outline-none"
                style={{ border: "1px solid #e2e8f0", color: "#0f172a" }}
              />
              <input
                type="date"
                value={newWeightDate}
                onChange={(e) => setNewWeightDate(e.target.value)}
                className="flex-1 text-sm px-2 py-1.5 rounded-lg outline-none"
                style={{ border: "1px solid #e2e8f0", color: "#0f172a" }}
              />
              <button
                onClick={handleAddWeight}
                disabled={addingWeight || !newWeight}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: "#2563eb", color: "#ffffff", cursor: !newWeight ? "not-allowed" : "pointer" }}
              >
                +
              </button>
            </div>

            {/* Lista */}
            {weightRecords.length === 0 ? (
              <p className="text-xs text-center py-3" style={{ color: "#cbd5e1" }}>Sin registros de peso</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {[...weightRecords].reverse().map((r, i) => {
                  const prev = weightRecords[weightRecords.length - 2 - i];
                  const diff = prev ? (r.weight - prev.weight).toFixed(1) : null;
                  return (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg group"
                      style={{ backgroundColor: "#f8fafc" }}>
                      <div>
                        <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>{r.weight} kg</span>
                        {diff !== null && (
                          <span className="text-xs ml-2" style={{ color: parseFloat(diff) > 0 ? "#dc2626" : "#16a34a" }}>
                            {parseFloat(diff) > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#94a3b8" }}>
                          {new Date(r.recorded_on + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <button
                          onClick={() => handleDeleteWeight(r.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs w-5 h-5 rounded flex items-center justify-center transition-opacity"
                          style={{ color: "#dc2626", backgroundColor: "#fef2f2" }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
