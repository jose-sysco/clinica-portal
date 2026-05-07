"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

export default function AdmissionFormPage({ params }) {
  const { token } = use(params);

  const [info,      setInfo]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState("");

  const [form, setForm] = useState({
    patient_dob:          "",
    allergies:            "",
    current_medications:  "",
    medical_history:      "",
    notes:                "",
  });

  useEffect(() => {
    fetch(`${API}/api/public/admissions/${token}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => { if (d) { setInfo(d); if (d.submitted) setSubmitted(true); } })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setError(""); setSending(true);
    try {
      const r = await fetch(`${API}/api/public/admissions/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Error al enviar"); return; }
      setSubmitted(true);
    } catch { setError("Error de conexión, intenta de nuevo."); }
    finally { setSending(false); }
  };

  const inp = {
    width: "100%", fontSize: "14px", padding: "10px 14px", borderRadius: "10px",
    border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#0f172a",
    outline: "none", boxSizing: "border-box",
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !info) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <p style={{ fontSize: "16px", color: "#94a3b8" }}>Formulario no encontrado</p>
      <Link href="/reservas" style={{ color: "#2563eb", fontSize: "14px", textDecoration: "none" }}>← Volver al directorio</Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 12px" }}>
            {info.clinic_name}
          </p>
          <h1 style={{ color: "#ffffff", fontSize: "22px", fontWeight: "800", margin: "0 0 8px" }}>
            Formulario de admisión
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>
            {info.doctor_name} · {info.scheduled_at}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Éxito */}
        {submitted && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#dcfce7", border: "1px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px" }}>
              ✓
            </div>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#16a34a", margin: "0 0 8px" }}>
              ¡Formulario enviado!
            </p>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>
              Gracias, {info.patient_name}. El profesional revisará tu información antes de la consulta.
            </p>
            <Link href="/reservas" style={{ color: "#2563eb", fontSize: "14px", textDecoration: "none" }}>
              ← Volver al directorio
            </Link>
          </div>
        )}

        {/* Formulario */}
        {!submitted && (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px", lineHeight: "1.6" }}>
              Hola <strong style={{ color: "#0f172a" }}>{info.patient_name}</strong>, completa este formulario
              para que el profesional pueda atenderte mejor. Todos los campos son opcionales.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Fecha de nacimiento
                </label>
                <input type="date" value={form.patient_dob}
                  onChange={(e) => setForm({ ...form, patient_dob: e.target.value })}
                  style={inp} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Alergias conocidas
                </label>
                <textarea value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  placeholder="Ej: penicilina, mariscos, látex... (escribe 'Ninguna' si no tienes)"
                  rows={2}
                  style={{ ...inp, resize: "vertical" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Medicamentos actuales
                </label>
                <textarea value={form.current_medications}
                  onChange={(e) => setForm({ ...form, current_medications: e.target.value })}
                  placeholder="Nombre del medicamento y dosis si es posible..."
                  rows={2}
                  style={{ ...inp, resize: "vertical" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Antecedentes médicos relevantes
                </label>
                <textarea value={form.medical_history}
                  onChange={(e) => setForm({ ...form, medical_history: e.target.value })}
                  placeholder="Cirugías previas, enfermedades crónicas, condiciones importantes..."
                  rows={3}
                  style={{ ...inp, resize: "vertical" }} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Nota adicional para el profesional
                </label>
                <textarea value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Cualquier otra información que consideres importante..."
                  rows={2}
                  style={{ ...inp, resize: "vertical" }} />
              </div>

              {error && (
                <p style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", margin: 0 }}>
                  {error}
                </p>
              )}

              <button onClick={handleSubmit} disabled={sending}
                style={{ backgroundColor: sending ? "#93c5fd" : "#2563eb", color: "#ffffff", fontSize: "14px", fontWeight: "700", padding: "13px", borderRadius: "12px", border: "none", cursor: sending ? "not-allowed" : "pointer", boxShadow: sending ? "none" : "0 4px 12px rgba(37,99,235,0.3)" }}>
                {sending ? "Enviando..." : "Enviar formulario →"}
              </button>

              <p style={{ fontSize: "12px", color: "#cbd5e1", textAlign: "center", margin: 0 }}>
                Tu información es confidencial y solo será vista por el profesional que te atenderá.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
