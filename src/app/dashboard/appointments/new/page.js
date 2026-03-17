"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organization } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Owner search
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showOwnerResults, setShowOwnerResults] = useState(false);
  const [showNewOwnerForm, setShowNewOwnerForm] = useState(false);
  const [newOwnerForm, setNewOwnerForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const [savingOwner, setSavingOwner] = useState(false);
  const ownerRef = useRef(null);

  // Patient
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "unknown",
    birthdate: "",
    weight: "",
    patient_type: config.patientType,
  });
  const [savingPatient, setSavingPatient] = useState(false);

  const [form, setForm] = useState({
    doctor_id: searchParams.get("doctor_id") || "",
    owner_id: searchParams.get("owner_id") || "",
    patient_id: searchParams.get("patient_id") || "",
    date: searchParams.get("date") || new Date().toISOString().split("T")[0],
    time: searchParams.get("time") || "",
    appointment_type: "first_visit",
    reason: "",
  });

  useEffect(() => {
    fetchDoctors();
    if (searchParams.get("owner_id"))
      loadOwnerFromParam(searchParams.get("owner_id"));
  }, []);

  useEffect(() => {
    if (form.doctor_id && form.date) fetchSlots();
  }, [form.doctor_id, form.date]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ownerRef.current && !ownerRef.current.contains(e.target))
        setShowOwnerResults(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadOwnerFromParam = async (ownerId) => {
    try {
      const res = await api.get(`/api/v1/owners/${ownerId}`);
      setSelectedOwner(res.data);
      setOwnerSearch(res.data.full_name);
      handleChange("owner_id", ownerId);
      fetchPatients(ownerId);
    } catch (err) {}
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/api/v1/doctors");
      setDoctors(res.data.data.filter((d) => d.status === "active"));
    } catch (err) {}
  };

  const fetchSlots = async () => {
    setLoading(true);
    setSlots([]);
    setForm((f) => ({ ...f, time: "" }));
    try {
      const res = await api.get(
        `/api/v1/doctors/${form.doctor_id}/availability`,
        {
          params: { date: form.date },
        },
      );
      setSlots(res.data.slots);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const searchOwners = async (q) => {
    if (q.length < 2) {
      setOwnerResults([]);
      return;
    }
    setOwnerLoading(true);
    try {
      const res = await api.get("/api/v1/owners", { params: { q } });
      setOwnerResults(res.data.data);
      setShowOwnerResults(true);
    } catch (err) {
    } finally {
      setOwnerLoading(false);
    }
  };

  const fetchPatients = async (ownerId) => {
    try {
      const res = await api.get(`/api/v1/owners/${ownerId}/patients`);
      setPatients(res.data.data.filter((p) => p.status === "active"));
    } catch (err) {}
  };

  const selectOwner = (owner) => {
    setSelectedOwner(owner);
    setOwnerSearch(owner.full_name);
    setShowOwnerResults(false);
    setShowNewOwnerForm(false);
    setSelectedPatient(null);
    setPatients([]);
    setShowNewPatientForm(false);
    handleChange("owner_id", owner.id);
    handleChange("patient_id", "");
    fetchPatients(owner.id);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowNewPatientForm(false);
    handleChange("patient_id", patient.id);
  };

  const clearOwner = () => {
    setSelectedOwner(null);
    setOwnerSearch("");
    setOwnerResults([]);
    setPatients([]);
    setSelectedPatient(null);
    setShowNewOwnerForm(false);
    setShowNewPatientForm(false);
    handleChange("owner_id", "");
    handleChange("patient_id", "");
  };

  // Crear propietario inline
  const handleCreateOwner = async () => {
    if (
      !newOwnerForm.first_name ||
      !newOwnerForm.last_name ||
      !newOwnerForm.phone
    ) {
      toast.error("Nombre, apellido y teléfono son requeridos");
      return;
    }
    setSavingOwner(true);
    try {
      const res = await api.post("/api/v1/owners", { owner: newOwnerForm });
      toast.success("Propietario creado correctamente");
      selectOwner(res.data);
      setNewOwnerForm({ first_name: "", last_name: "", phone: "", email: "" });
    } catch (err) {
      toast.error("Error al crear el propietario");
    } finally {
      setSavingOwner(false);
    }
  };

  // Crear paciente inline
  const handleCreatePatient = async () => {
    if (!newPatientForm.name) {
      toast.error("El nombre es requerido");
      return;
    }
    setSavingPatient(true);
    try {
      const res = await api.post(
        `/api/v1/owners/${selectedOwner.id}/patients`,
        {
          patient: newPatientForm,
        },
      );
      toast.success("Paciente creado correctamente");
      selectPatient(res.data);
      setNewPatientForm({
        name: "",
        species: "",
        breed: "",
        gender: "unknown",
        birthdate: "",
        weight: "",
        patient_type: config.patientType,
      });
      fetchPatients(selectedOwner.id);
    } catch (err) {
      toast.error("Error al crear el paciente");
    } finally {
      setSavingPatient(false);
    }
  };

  const handleChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (
      !form.doctor_id ||
      !form.patient_id ||
      !form.owner_id ||
      !form.time ||
      !form.reason
    ) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/v1/appointments", {
        appointment: {
          doctor_id: parseInt(form.doctor_id),
          patient_id: parseInt(form.patient_id),
          owner_id: parseInt(form.owner_id),
          scheduled_at: `${form.date}T${form.time}:00`,
          appointment_type: form.appointment_type,
          reason: form.reason,
        },
      });
      toast.success("Cita creada correctamente");
      router.push("/dashboard/appointments");
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Error al crear la cita");
    } finally {
      setSubmitting(false);
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

  const smallInputStyle = {
    width: "100%",
    padding: "6px 10px",
    fontSize: "13px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };

  return (
    <div className="h-full space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/appointments">
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
            Nueva cita
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            Completa los datos para agendar
          </p>
        </div>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="h-full">
        <div className="grid grid-cols-2 gap-5">
          {/* Columna izquierda — Médico y horario */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              Médico y horario
            </p>

            <div>
              <label style={labelStyle}>Doctor *</label>
              <select
                value={form.doctor_id}
                onChange={(e) => handleChange("doctor_id", e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">Selecciona un doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} — {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Fecha *</label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleChange("date", e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Horario disponible *</label>
              {!form.doctor_id ? (
                <p className="text-sm py-2" style={{ color: "#94a3b8" }}>
                  Selecciona un doctor primero
                </p>
              ) : loading ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm" style={{ color: "#64748b" }}>
                    Cargando horarios...
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm py-2" style={{ color: "#94a3b8" }}>
                  No hay horarios disponibles
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChange("time", slot.starts_at)}
                      className="py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor:
                          form.time === slot.starts_at ? "#2563eb" : "#eff6ff",
                        color:
                          form.time === slot.starts_at ? "#ffffff" : "#2563eb",
                        border: `1px solid ${form.time === slot.starts_at ? "#2563eb" : "#bfdbfe"}`,
                      }}
                    >
                      {slot.starts_at}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha — Paciente y motivo */}
          <div
            className="rounded-xl p-6 shadow-sm space-y-5"
            style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              {config.patientLabel} y motivo
            </p>

            {/* Buscador de owner */}
            <div ref={ownerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ ...labelStyle, marginBottom: 0 }}>
                  {config.ownerLabel} *
                </label>
                {!selectedOwner && !showNewOwnerForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewOwnerForm(true)}
                    className="text-xs font-medium"
                    style={{ color: "#2563eb" }}
                  >
                    + Crear nuevo
                  </button>
                )}
              </div>

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
                    onClick={clearOwner}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: "#dc2626", backgroundColor: "#fef2f2" }}
                  >
                    Cambiar
                  </button>
                </div>
              ) : showNewOwnerForm ? (
                <div
                  className="rounded-lg p-3 space-y-2"
                  style={{
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#64748b" }}
                  >
                    Nuevo {config.ownerLabel.toLowerCase()}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre *"
                      value={newOwnerForm.first_name}
                      onChange={(e) =>
                        setNewOwnerForm((f) => ({
                          ...f,
                          first_name: e.target.value,
                        }))
                      }
                      style={smallInputStyle}
                    />
                    <input
                      type="text"
                      placeholder="Apellido *"
                      value={newOwnerForm.last_name}
                      onChange={(e) =>
                        setNewOwnerForm((f) => ({
                          ...f,
                          last_name: e.target.value,
                        }))
                      }
                      style={smallInputStyle}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Teléfono *"
                    value={newOwnerForm.phone}
                    onChange={(e) =>
                      setNewOwnerForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    style={smallInputStyle}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newOwnerForm.email}
                    onChange={(e) =>
                      setNewOwnerForm((f) => ({ ...f, email: e.target.value }))
                    }
                    style={smallInputStyle}
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCreateOwner}
                      disabled={savingOwner}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: savingOwner ? "#93c5fd" : "#2563eb",
                        color: "#ffffff",
                      }}
                    >
                      {savingOwner ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewOwnerForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
                    >
                      Cancelar
                    </button>
                  </div>
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
                    placeholder={`Buscar ${config.ownerLabel.toLowerCase()}...`}
                    style={inputStyle}
                  />
                  {ownerLoading && (
                    <div className="absolute right-3 top-2.5">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {showOwnerResults && ownerResults.length > 0 && (
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
                          onClick={() => selectOwner(owner)}
                          className="w-full text-left px-4 py-3 transition-colors"
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f8fafc")
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
                          <p className="text-xs" style={{ color: "#94a3b8" }}>
                            {owner.phone}{" "}
                            {owner.email ? `· ${owner.email}` : ""}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {showOwnerResults &&
                    ownerResults.length === 0 &&
                    ownerSearch.length >= 2 &&
                    !ownerLoading && (
                      <div
                        className="absolute z-10 w-full mt-1 rounded-lg p-3 text-center"
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <p className="text-sm" style={{ color: "#94a3b8" }}>
                          No se encontraron {config.ownersLabel.toLowerCase()}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Selector de paciente */}
            {selectedOwner && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>
                    {config.patientLabel} *
                  </label>
                  {!selectedPatient && !showNewPatientForm && (
                    <button
                      type="button"
                      onClick={() => setShowNewPatientForm(true)}
                      className="text-xs font-medium"
                      style={{ color: "#2563eb" }}
                    >
                      + Crear nuevo
                    </button>
                  )}
                </div>

                {selectedPatient ? (
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
                        {selectedPatient.name}
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>
                        {config.showSpecies
                          ? selectedPatient.species ||
                            selectedPatient.patient_type
                          : selectedPatient.gender === "male"
                            ? "Masculino"
                            : selectedPatient.gender === "female"
                              ? "Femenino"
                              : "—"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setShowNewPatientForm(false);
                        handleChange("patient_id", "");
                      }}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: "#dc2626", backgroundColor: "#fef2f2" }}
                    >
                      Cambiar
                    </button>
                  </div>
                ) : showNewPatientForm ? (
                  <div
                    className="rounded-lg p-3 space-y-2"
                    style={{
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <p
                      className="text-xs font-semibold"
                      style={{ color: "#64748b" }}
                    >
                      Nuevo {config.patientLabel.toLowerCase()}
                    </p>
                    <input
                      type="text"
                      placeholder={`Nombre * ${config.patientType === "animal" ? "(Firulais)" : "(Juan Pérez)"}`}
                      value={newPatientForm.name}
                      onChange={(e) =>
                        setNewPatientForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                      style={smallInputStyle}
                    />
                    {config.showSpecies && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Especie (Perro, Gato...)"
                          value={newPatientForm.species}
                          onChange={(e) =>
                            setNewPatientForm((f) => ({
                              ...f,
                              species: e.target.value,
                            }))
                          }
                          style={smallInputStyle}
                        />
                        <input
                          type="text"
                          placeholder="Raza"
                          value={newPatientForm.breed}
                          onChange={(e) =>
                            setNewPatientForm((f) => ({
                              ...f,
                              breed: e.target.value,
                            }))
                          }
                          style={smallInputStyle}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newPatientForm.gender}
                        onChange={(e) =>
                          setNewPatientForm((f) => ({
                            ...f,
                            gender: e.target.value,
                          }))
                        }
                        style={smallInputStyle}
                      >
                        <option value="unknown">Género</option>
                        <option value="male">
                          {config.showAnimalGender ? "Macho" : "Masculino"}
                        </option>
                        <option value="female">
                          {config.showAnimalGender ? "Hembra" : "Femenino"}
                        </option>
                      </select>
                      <input
                        type="date"
                        value={newPatientForm.birthdate}
                        onChange={(e) =>
                          setNewPatientForm((f) => ({
                            ...f,
                            birthdate: e.target.value,
                          }))
                        }
                        style={smallInputStyle}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCreatePatient}
                        disabled={savingPatient}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: savingPatient
                            ? "#93c5fd"
                            : "#2563eb",
                          color: "#ffffff",
                        }}
                      >
                        {savingPatient ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewPatientForm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : patients.length === 0 ? (
                  <p className="text-sm py-2" style={{ color: "#94a3b8" }}>
                    Sin {config.patientsLabel.toLowerCase()} — usa "+ Crear
                    nuevo"
                  </p>
                ) : (
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: "1px solid #e2e8f0" }}
                  >
                    {patients.map((patient, index) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full text-left px-4 py-3 transition-colors"
                        style={{
                          borderBottom:
                            index < patients.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f8fafc")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: "#eff6ff" }}
                          >
                            <span
                              className="text-xs font-semibold"
                              style={{ color: "#2563eb" }}
                            >
                              {patient.name?.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{ color: "#0f172a" }}
                            >
                              {patient.name}
                            </p>
                            <p className="text-xs" style={{ color: "#94a3b8" }}>
                              {config.showSpecies
                                ? `${patient.species || ""}${patient.breed ? ` · ${patient.breed}` : ""}`
                                : patient.gender === "male"
                                  ? "Masculino"
                                  : patient.gender === "female"
                                    ? "Femenino"
                                    : "—"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={labelStyle}>Tipo de consulta *</label>
              <select
                value={form.appointment_type}
                onChange={(e) =>
                  handleChange("appointment_type", e.target.value)
                }
                style={inputStyle}
                required
              >
                <option value="first_visit">Primera visita</option>
                <option value="follow_up">Seguimiento</option>
                <option value="emergency">Emergencia</option>
                <option value="routine">Rutina</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Motivo de consulta *</label>
              <textarea
                value={form.reason}
                onChange={(e) => handleChange("reason", e.target.value)}
                placeholder="Describe el motivo de la consulta..."
                rows={3}
                style={{ ...inputStyle, resize: "none" }}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: submitting ? "#93c5fd" : "#2563eb",
                  color: "#ffffff",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Creando cita..." : "Crear cita"}
              </button>
              <Link href="/dashboard/appointments">
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
          </div>
        </div>
      </form>
    </div>
  );
}
