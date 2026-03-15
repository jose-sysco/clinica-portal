"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function NewPatientPage() {
  const router = useRouter();
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [isAdult, setIsAdult] = useState(config.adultCheck ? null : true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const [patientForm, setPatientForm] = useState({
    name: "",
    patient_type: config.patientType,
    species: "",
    breed: "",
    gender: "unknown",
    birthdate: "",
    weight: "",
    notes: "",
  });

  const [ownerForm, setOwnerForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    identification: "",
  });

  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerMode, setOwnerMode] = useState("search");

  const handlePatient = (field, value) =>
    setPatientForm((f) => ({ ...f, [field]: value }));
  const handleOwner = (field, value) =>
    setOwnerForm((f) => ({ ...f, [field]: value }));

  const searchOwners = async (q) => {
    if (q.length < 2) {
      setOwnerResults([]);
      return;
    }
    setOwnerLoading(true);
    try {
      const res = await api.get("/api/v1/owners", { params: { q } });
      setOwnerResults(res.data.data);
    } catch (err) {
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      let ownerId = null;

      if (config.requiresOwner || !isAdult) {
        if (selectedOwner) {
          ownerId = selectedOwner.id;
        } else {
          const ownerRes = await api.post("/api/v1/owners", {
            owner: ownerForm,
          });
          ownerId = ownerRes.data.id;
        }
      } else {
        // Adulto — owner = paciente
        const nameParts = patientForm.name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || firstName;

        const ownerRes = await api.post("/api/v1/owners", {
          owner: {
            first_name: firstName,
            last_name: lastName,
            email: ownerForm.email,
            phone: ownerForm.phone,
            identification: ownerForm.identification,
          },
        });
        ownerId = ownerRes.data.id;
      }

      await api.post(`/api/v1/owners/${ownerId}/patients`, {
        patient: patientForm,
      });

      toast.success(`${config.patientLabel} registrado correctamente`);
      router.push("/dashboard/patients");
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error("Error al registrar");
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

  // Paso 1 — Solo para clínicas con adultCheck
  if (config.adultCheck && isAdult === null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
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
              Nuevo {config.patientLabel.toLowerCase()}
            </h1>
          </div>
        </div>

        <div
          className="rounded-xl p-8 shadow-sm max-w-md mx-auto text-center"
          style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
        >
          <p
            className="text-sm font-semibold mb-2"
            style={{ color: "#0f172a" }}
          >
            ¿El paciente es mayor de edad?
          </p>
          <p className="text-xs mb-6" style={{ color: "#94a3b8" }}>
            Esto determina si requiere un responsable
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsAdult(true)}
              className="py-4 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                border: "2px solid #bfdbfe",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#dbeafe")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#eff6ff")
              }
            >
              Sí, mayor de 18 años
            </button>
            <button
              onClick={() => setIsAdult(false)}
              className="py-4 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
                border: "2px solid #bbf7d0",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#dcfce7")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0fdf4")
              }
            >
              No, menor de edad
            </button>
          </div>
        </div>
      </div>
    );
  }

  const needsOwner = config.requiresOwner || !isAdult;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            config.adultCheck && isAdult !== null
              ? setIsAdult(null)
              : router.back()
          }
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{
            color: "#64748b",
            backgroundColor: "#f1f5f9",
            border: "1px solid #e2e8f0",
          }}
        >
          ← Volver
        </button>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Nuevo {config.patientLabel.toLowerCase()}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {!needsOwner
              ? "El paciente será registrado como su propio responsable"
              : `Completa los datos del paciente y ${config.ownerLabel.toLowerCase()}`}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          {/* Columna izquierda — Datos del paciente */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Datos del {config.patientLabel.toLowerCase()}
            </p>

            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input
                type="text"
                value={patientForm.name}
                onChange={(e) => handlePatient("name", e.target.value)}
                placeholder={
                  config.patientType === "animal" ? "Firulais" : "Juan Pérez"
                }
                style={inputStyle}
                required
              />
            </div>

            {/* Solo veterinaria muestra especie y raza */}
            {config.showSpecies && (
              <div>
                <label style={labelStyle}>Especie *</label>
                <input
                  type="text"
                  value={patientForm.species}
                  onChange={(e) => handlePatient("species", e.target.value)}
                  placeholder="Perro, Gato, Ave..."
                  style={inputStyle}
                  required
                />
              </div>
            )}

            {config.showBreed && (
              <div>
                <label style={labelStyle}>Raza</label>
                <input
                  type="text"
                  value={patientForm.breed}
                  onChange={(e) => handlePatient("breed", e.target.value)}
                  placeholder="Labrador, Siamés..."
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>
                {config.showAnimalGender ? "Sexo" : "Género"}
              </label>
              <select
                value={patientForm.gender}
                onChange={(e) => handlePatient("gender", e.target.value)}
                style={inputStyle}
              >
                <option value="unknown">No especificado</option>
                <option value="male">
                  {config.showAnimalGender ? "Macho" : "Masculino"}
                </option>
                <option value="female">
                  {config.showAnimalGender ? "Hembra" : "Femenino"}
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Fecha de nacimiento</label>
              <input
                type="date"
                value={patientForm.birthdate}
                onChange={(e) => handlePatient("birthdate", e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Peso (kg)</label>
              <input
                type="number"
                step="0.01"
                value={patientForm.weight}
                onChange={(e) => handlePatient("weight", e.target.value)}
                placeholder="25.5"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Notas</label>
              <textarea
                value={patientForm.notes}
                onChange={(e) => handlePatient("notes", e.target.value)}
                placeholder="Alergias, condiciones especiales..."
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
          </div>

          {/* Columna derecha — Responsable */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-4"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            {!needsOwner ? (
              <>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#94a3b8" }}
                >
                  Datos de contacto
                </p>
                <div
                  className="px-3 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  El paciente será registrado como su propio responsable
                </div>
                <div>
                  <label style={labelStyle}>Teléfono *</label>
                  <input
                    type="text"
                    value={ownerForm.phone}
                    onChange={(e) => handleOwner("phone", e.target.value)}
                    placeholder="55551234"
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={ownerForm.email}
                    onChange={(e) => handleOwner("email", e.target.value)}
                    placeholder="paciente@email.com"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Identificación</label>
                  <input
                    type="text"
                    value={ownerForm.identification}
                    onChange={(e) =>
                      handleOwner("identification", e.target.value)
                    }
                    placeholder="1234567"
                    style={inputStyle}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#94a3b8" }}
                  >
                    {config.ownerLabel}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerMode("search");
                        setSelectedOwner(null);
                      }}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor:
                          ownerMode === "search" ? "#2563eb" : "#f1f5f9",
                        color: ownerMode === "search" ? "#ffffff" : "#64748b",
                      }}
                    >
                      Buscar existente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerMode("new");
                        setSelectedOwner(null);
                      }}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor:
                          ownerMode === "new" ? "#2563eb" : "#f1f5f9",
                        color: ownerMode === "new" ? "#ffffff" : "#64748b",
                      }}
                    >
                      Registrar nuevo
                    </button>
                  </div>
                </div>

                {ownerMode === "search" ? (
                  <div className="space-y-3">
                    {selectedOwner ? (
                      <div
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{
                          border: "1px solid #bfdbfe",
                          backgroundColor: "#eff6ff",
                        }}
                      >
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#0f172a" }}
                          >
                            {selectedOwner.full_name}
                          </p>
                          <p className="text-xs" style={{ color: "#64748b" }}>
                            {selectedOwner.phone}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOwner(null);
                            setOwnerSearch("");
                          }}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            color: "#dc2626",
                            backgroundColor: "#fef2f2",
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={ownerSearch}
                          onChange={(e) => {
                            setOwnerSearch(e.target.value);
                            searchOwners(e.target.value);
                          }}
                          placeholder={`Buscar ${config.ownerLabel.toLowerCase()} existente...`}
                          style={inputStyle}
                        />
                        {ownerLoading && (
                          <div className="absolute right-3 top-2.5">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {ownerResults.length > 0 && (
                          <div
                            className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {ownerResults.map((owner) => (
                              <button
                                key={owner.id}
                                type="button"
                                onClick={() => {
                                  setSelectedOwner(owner);
                                  setOwnerSearch(owner.full_name);
                                  setOwnerResults([]);
                                }}
                                className="w-full text-left px-4 py-3 transition-colors"
                                style={{ borderBottom: "1px solid #f1f5f9" }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "#f8fafc")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor =
                                    "transparent")
                                }
                              >
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "#0f172a" }}
                                >
                                  {owner.full_name}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "#94a3b8" }}
                                >
                                  {owner.phone}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelStyle}>Nombre *</label>
                        <input
                          type="text"
                          value={ownerForm.first_name}
                          onChange={(e) =>
                            handleOwner("first_name", e.target.value)
                          }
                          placeholder="Juan"
                          style={inputStyle}
                          required
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Apellido *</label>
                        <input
                          type="text"
                          value={ownerForm.last_name}
                          onChange={(e) =>
                            handleOwner("last_name", e.target.value)
                          }
                          placeholder="Pérez"
                          style={inputStyle}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Teléfono *</label>
                      <input
                        type="text"
                        value={ownerForm.phone}
                        onChange={(e) => handleOwner("phone", e.target.value)}
                        placeholder="55551234"
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        type="email"
                        value={ownerForm.email}
                        onChange={(e) => handleOwner("email", e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Identificación</label>
                      <input
                        type="text"
                        value={ownerForm.identification}
                        onChange={(e) =>
                          handleOwner("identification", e.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
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
            {loading
              ? "Registrando..."
              : `Registrar ${config.patientLabel.toLowerCase()}`}
          </button>
          <Link href="/dashboard/patients">
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
