"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus]   = useState("verifying"); // "verifying" | "success" | "error"
  const [message, setMessage] = useState("");

  // Resend form
  const [showResend, setShowResend]     = useState(false);
  const [resendEmail, setResendEmail]   = useState("");
  const [resendSlug, setResendSlug]     = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone]     = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No se encontró el token de verificación.");
      return;
    }

    api
      .post("/api/v1/auth/verify_email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.error || "El enlace es inválido o ya fue utilizado."
        );
      });
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    setResendLoading(true);
    try {
      await api.post("/api/v1/auth/resend_verification", {
        email:             resendEmail,
        organization_slug: resendSlug,
      });
      setResendDone(true);
    } finally {
      setResendLoading(false);
    }
  };

  const inputStyle = {
    width:           "100%",
    height:          "44px",
    padding:         "0 12px",
    fontSize:        "14px",
    border:          "1.5px solid #e2e8f0",
    borderRadius:    "8px",
    outline:         "none",
    backgroundColor: "#ffffff",
    color:           "#0f172a",
    boxSizing:       "border-box",
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f1f5f9" }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
      >
        {/* ── Verificando ───────────────────────────────────────────── */}
        {status === "verifying" && (
          <>
            <div style={{ background: "#4f46e5", padding: "32px 40px", textAlign: "center" }}>
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
            <div style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#475569", fontSize: "15px" }}>Verificando tu cuenta...</p>
            </div>
          </>
        )}

        {/* ── Éxito ─────────────────────────────────────────────────── */}
        {status === "success" && (
          <>
            <div style={{ background: "#16a34a", padding: "32px 40px", textAlign: "center" }}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <span style={{ fontSize: "28px" }}>✅</span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: "#ffffff", margin: 0 }}>
                ¡Cuenta verificada!
              </h1>
            </div>
            <div style={{ padding: "40px" }}>
              <p style={{ color: "#475569", fontSize: "15px", lineHeight: "1.6", textAlign: "center", marginTop: 0 }}>
                Tu correo ha sido verificado exitosamente. Ya puedes iniciar sesión en tu cuenta.
              </p>
              <div
                className="rounded-lg"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", margin: "24px 0" }}
              >
                <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
                  🎉 Tu clínica ya está lista para usar. Inicia sesión para comenzar.
                </p>
              </div>
              <Link href="/login">
                <button
                  className="w-full rounded-xl font-semibold text-sm"
                  style={{
                    height:     "44px",
                    background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                    color:      "#ffffff",
                    border:     "none",
                    cursor:     "pointer",
                    boxShadow:  "0 4px 16px rgba(37,99,235,0.35)",
                  }}
                >
                  Iniciar sesión →
                </button>
              </Link>
            </div>
          </>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {status === "error" && (
          <>
            <div style={{ background: "#dc2626", padding: "32px 40px", textAlign: "center" }}>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <span style={{ fontSize: "28px" }}>❌</span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: "#ffffff", margin: 0 }}>
                Enlace inválido
              </h1>
            </div>
            <div style={{ padding: "40px" }}>
              <p style={{ color: "#475569", fontSize: "15px", lineHeight: "1.6", textAlign: "center", marginTop: 0 }}>
                {message}
              </p>

              {!showResend && !resendDone && (
                <button
                  onClick={() => setShowResend(true)}
                  className="w-full rounded-xl font-semibold text-sm"
                  style={{
                    height:          "44px",
                    backgroundColor: "#f1f5f9",
                    color:           "#374151",
                    border:          "1px solid #e2e8f0",
                    cursor:          "pointer",
                    marginTop:       "16px",
                  }}
                >
                  Reenviar enlace de verificación
                </button>
              )}

              {showResend && !resendDone && (
                <form onSubmit={handleResend} style={{ marginTop: "24px" }}>
                  <div
                    style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px" }}
                  >
                    <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Reenviar verificación
                    </p>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                        Slug de tu organización
                      </label>
                      <input
                        type="text"
                        value={resendSlug}
                        onChange={(e) => setResendSlug(e.target.value)}
                        placeholder="mi-clinica"
                        required
                        style={inputStyle}
                      />
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                        Lo puedes ver en la URL de tu clínica o en el correo de registro.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={resendLoading}
                      className="w-full rounded-lg font-medium text-sm"
                      style={{
                        height:          "40px",
                        backgroundColor: resendLoading ? "#93c5fd" : "#2563eb",
                        color:           "#ffffff",
                        border:          "none",
                        cursor:          resendLoading ? "not-allowed" : "pointer",
                      }}
                    >
                      {resendLoading ? "Enviando..." : "Enviar nuevo enlace"}
                    </button>
                  </div>
                </form>
              )}

              {resendDone && (
                <div
                  className="rounded-lg"
                  style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "16px", marginTop: "16px" }}
                >
                  <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
                    ✓ Si el correo existe y no está verificado, recibirás un nuevo enlace en breve.
                  </p>
                </div>
              )}

              <Link href="/login">
                <button
                  className="w-full rounded-xl font-medium text-sm"
                  style={{
                    height:          "44px",
                    backgroundColor: "transparent",
                    color:           "#64748b",
                    border:          "none",
                    cursor:          "pointer",
                    marginTop:       "16px",
                  }}
                >
                  ← Volver al inicio de sesión
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
