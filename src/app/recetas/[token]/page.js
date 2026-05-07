"use client";

import { useState, useEffect, use } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

const STATUS_COLORS = {
  active:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", label: "Válida" },
  revoked: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", label: "Revocada" },
};

function MedBadge({ med, idx }) {
  return (
    <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px", marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 }}>
          {idx + 1}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>{med.name}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {med.dose && (
              <span style={{ fontSize: "12px", backgroundColor: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: "20px" }}>{med.dose}</span>
            )}
            {med.frequency && (
              <span style={{ fontSize: "12px", backgroundColor: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: "20px" }}>{med.frequency}</span>
            )}
            {med.duration && (
              <span style={{ fontSize: "12px", backgroundColor: "#fefce8", color: "#ca8a04", padding: "2px 8px", borderRadius: "20px" }}>por {med.duration}</span>
            )}
          </div>
          {med.instructions && (
            <p style={{ fontSize: "12px", color: "#64748b", margin: "6px 0 0", fontStyle: "italic" }}>{med.instructions}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionVerificationPage({ params }) {
  const { token } = use(params);
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/public/prescriptions/${token}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px" }}>
      <div style={{ fontSize: "48px" }}>🔍</div>
      <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Receta no encontrada</p>
      <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center" }}>
        Este enlace no corresponde a ninguna receta válida en el sistema.
      </p>
    </div>
  );

  const statusCfg = STATUS_COLORS[data.status] || STATUS_COLORS.active;

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 24px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Verificación de Receta
          </p>
          <p style={{ color: "#ffffff", fontSize: "20px", fontWeight: "800", margin: "0 0 4px" }}>
            {data.clinic_name}
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>
            Dr(a). {data.doctor_name}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "24px" }}>
        {/* Status banner */}
        {data.revoked && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626", margin: 0 }}>
              Esta receta ha sido revocada y ya no es válida.
            </p>
          </div>
        )}

        {/* Patient + dates card */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paciente</p>
              <p style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{data.patient_name}</p>
            </div>
            <span style={{ ...statusCfg, fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px", border: `1px solid ${statusCfg.border}` }}>
              {statusCfg.label}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 2px" }}>Fecha de emisión</p>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{formatDate(data.issued_at)}</p>
            </div>
            {data.valid_until && (
              <div>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 2px" }}>Válida hasta</p>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", margin: 0 }}>{formatDate(data.valid_until)}</p>
              </div>
            )}
          </div>
          {data.diagnosis && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 2px" }}>Diagnóstico</p>
              <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{data.diagnosis}</p>
            </div>
          )}
        </div>

        {/* Medications */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "6px" }}>
            ℞ Medicamentos
            <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>
              {data.medications?.length || 0}
            </span>
          </p>
          {data.medications?.map((med, i) => <MedBadge key={i} med={med} idx={i} />)}
        </div>

        {/* Notes */}
        {data.notes && (
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#92400e", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Indicaciones</p>
            <p style={{ fontSize: "13px", color: "#78350f", margin: 0, lineHeight: "1.6" }}>{data.notes}</p>
          </div>
        )}

        {/* Footer verification */}
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
            Documento digital generado por <strong style={{ color: "#64748b" }}>{data.clinic_name}</strong>
          </p>
          {data.clinic_phone && (
            <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>Tel: {data.clinic_phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
