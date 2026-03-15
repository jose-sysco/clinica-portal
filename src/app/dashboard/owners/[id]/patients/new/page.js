"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function NewPatientPage() {
  const router = useRouter();
  const { id } = useParams();
  const { organization } = useAuth();

  const isVetOrPediatric =
    organization?.clinic_type === "veterinary" ||
    organization?.clinic_type === "pediatric";

  const [form, setForm] = useState({
    name: "",
    patient_type: isVetOrPediatric ? "animal" : "human",
    species: "",
    breed: "",
    gender: "unknown",
    birthdate: "",
    weight: "",
    notes: "",
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await api.post(`/api/v1/owners/${id}/patients`, { patient: form });
      toast.success("Paciente creado correctamente");
      router.push(`/dashboard/owners/${id}/patients`);
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error(err.response?.data?.error || "Error al crear paciente");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "6px",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/owners/${id}/patients`}>
          <button
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{
              color: "#64748b",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
            }}
          >
            ← Volver
          </button>
        </Link>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Nuevo paciente
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Registra un nuevo paciente
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          }}
        >
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-5">
          {/* Columna izquierda */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Datos del paciente
            </p>

            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={isVetOrPediatric ? "Firulais" : "Juan Pérez"}
                style={inputStyle}
                required
              />
            </div>

            {isVetOrPediatric && (
              <div>
                <label style={labelStyle}>Tipo de paciente *</label>
                <select
                  value={form.patient_type}
                  onChange={(e) => handleChange("patient_type", e.target.value)}
                  style={inputStyle}
                >
                  <option value="animal">Animal</option>
                  <option value="human">Humano</option>
                </select>
              </div>
            )}

            {form.patient_type === "animal" && (
              <>
                <div>
                  <label style={labelStyle}>Especie *</label>
                  <input
                    type="text"
                    value={form.species}
                    onChange={(e) => handleChange("species", e.target.value)}
                    placeholder="Perro, Gato, Ave..."
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Raza</label>
                  <input
                    type="text"
                    value={form.breed}
                    onChange={(e) => handleChange("breed", e.target.value)}
                    placeholder="Labrador, Siamés..."
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            <div>
              <label style={labelStyle}>Género</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                style={inputStyle}
              >
                <option value="unknown">No especificado</option>
                <option value="male">Macho / Masculino</option>
                <option value="female">Hembra / Femenino</option>
              </select>
            </div>
          </div>

          {/* Columna derecha */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Datos médicos
            </p>

            <div>
              <label style={labelStyle}>Fecha de nacimiento (dd/mm/yyyy)</label>
              <input
                type="date"
                value={form.birthdate}
                onChange={(e) => handleChange("birthdate", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Peso (lb)</label>
              <input
                type="number"
                step="0.01"
                value={form.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                placeholder="25.5"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Notas</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Alergias, condiciones especiales..."
                rows={5}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-5">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: loading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creando..." : "Crear paciente"}
          </button>
          <Link href={`/dashboard/owners/${id}/patients`}>
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                border: "1px solid #e2e8f0",
              }}
            >
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}
