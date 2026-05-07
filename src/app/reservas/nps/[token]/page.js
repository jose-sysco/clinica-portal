"use client";

import { useState, useEffect, use } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

export default function NpsPage({ params }) {
  const { token } = use(params);

  const [info,      setInfo]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score,     setScore]     = useState(null);
  const [comment,   setComment]   = useState("");
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    const urlScore = new URLSearchParams(window.location.search).get("score");

    fetch(`${API}/api/public/nps/${token}`)
      .then((r) => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
      .then((d) => {
        if (!d) return;
        setInfo(d);
        if (d.submitted) { setSubmitted(true); setScore(d.score); return; }
        if (urlScore) {
          const s = parseInt(urlScore, 10);
          if (s >= 1 && s <= 10) handleSubmit(s, token);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (scoreValue, t = token) => {
    setSending(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/public/nps/${t}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreValue, comment }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Error al enviar"); return; }
      setScore(scoreValue);
      setSubmitted(true);
    } catch { setError("Error de conexión, intenta de nuevo."); }
    finally { setSending(false); }
  };

  const scoreColor = (n) => {
    if (!n) return { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" };
    if (n <= 6) return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    if (n <= 8) return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
    return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
  };

  const scoreLabel = (n) => {
    if (!n) return "";
    if (n <= 6) return "Necesitamos mejorar";
    if (n <= 8) return "Bien, pero hay margen";
    return "¡Excelente!";
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <p style={{ fontSize: "15px", color: "#94a3b8" }}>Encuesta no encontrada</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 24px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 10px" }}>
            {info?.clinic_name}
          </p>
          <h1 style={{ color: "#ffffff", fontSize: "22px", fontWeight: "800", margin: "0 0 6px" }}>
            ¿Cómo fue tu visita?
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: 0 }}>
            Con {info?.doctor_name}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "32px 24px" }}>
        {submitted ? (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
            <div style={{ ...scoreColor(score), width: "72px", height: "72px", borderRadius: "50%", border: `1px solid ${scoreColor(score).border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "26px", fontWeight: "800" }}>
              {score}
            </div>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px" }}>
              ¡Gracias, {info?.patient_name}!
            </p>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
              {scoreLabel(score)} — Tu opinión ayuda a {info?.clinic_name} a mejorar.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px", lineHeight: "1.6" }}>
              Hola <strong style={{ color: "#0f172a" }}>{info?.patient_name}</strong>, ¿qué tan probable es
              que recomiendes <strong style={{ color: "#0f172a" }}>{info?.clinic_name}</strong> a alguien?
            </p>

            {/* Rating 1-10 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "8px" }}>
              {[1,2,3,4,5,6,7,8,9,10].map((n) => {
                const c = n <= 6 ? { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" }
                        : n <= 8 ? { bg: "#fffbeb", color: "#d97706", border: "#fde68a" }
                        : { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
                const selected = score === n;
                return (
                  <button key={n} onClick={() => setScore(n)} disabled={sending}
                    style={{
                      padding: "12px 0", borderRadius: "10px", fontSize: "15px", fontWeight: "700",
                      border: `2px solid ${selected ? c.color : c.border}`,
                      backgroundColor: selected ? c.color : c.bg,
                      color: selected ? "#ffffff" : c.color,
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {n}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Poco probable</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Muy probable</span>
            </div>

            {score !== null && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>
                  Comentario opcional
                </label>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="¿Qué podríamos mejorar? ¿Qué te gustó?"
                  rows={3}
                  style={{ width: "100%", fontSize: "14px", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#0f172a", outline: "none", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            )}

            {error && (
              <p style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", margin: "0 0 16px" }}>
                {error}
              </p>
            )}

            <button onClick={() => handleSubmit(score)} disabled={score === null || sending}
              style={{
                width: "100%", backgroundColor: score === null ? "#e2e8f0" : sending ? "#93c5fd" : "#2563eb",
                color: score === null ? "#94a3b8" : "#ffffff",
                fontSize: "14px", fontWeight: "700", padding: "13px",
                borderRadius: "12px", border: "none",
                cursor: score === null || sending ? "not-allowed" : "pointer",
              }}>
              {sending ? "Enviando..." : score === null ? "Selecciona una puntuación" : `Enviar puntuación (${score}/10) →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
