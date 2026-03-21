"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const CLINIC_TYPES = [
  { group: "Salud médica",       options: [
    { value: "general",       label: "Medicina General" },
    { value: "pediatric",     label: "Pediatría" },
    { value: "dental",        label: "Odontología" },
    { value: "psychology",    label: "Psicología" },
    { value: "physiotherapy", label: "Fisioterapia / Rehabilitación" },
    { value: "nutrition",     label: "Nutrición y Dietética" },
  ]},
  { group: "Animales",           options: [
    { value: "veterinary",    label: "Clínica Veterinaria" },
  ]},
  { group: "Bienestar y fitness",options: [
    { value: "fitness",       label: "Fitness / Entrenamiento personal" },
    { value: "beauty",        label: "Salón de belleza / Estética" },
    { value: "coaching",      label: "Coaching" },
  ]},
  { group: "Servicios profesionales", options: [
    { value: "legal",         label: "Asesoría Legal / Abogados" },
  ]},
];

const TIMEZONES = [
  { value: "UTC",                      label: "UTC" },
  { value: "America/Guatemala",        label: "Guatemala (UTC-6)" },
  { value: "America/Mexico_City",      label: "México Centro (UTC-6)" },
  { value: "America/Bogota",           label: "Colombia / Perú (UTC-5)" },
  { value: "America/Lima",             label: "Lima (UTC-5)" },
  { value: "America/Santiago",         label: "Santiago (UTC-4/-3)" },
  { value: "America/Buenos_Aires",     label: "Buenos Aires (UTC-3)" },
  { value: "America/Sao_Paulo",        label: "São Paulo (UTC-3)" },
  { value: "America/New_York",         label: "Nueva York (UTC-5/-4)" },
  { value: "America/Los_Angeles",      label: "Los Ángeles (UTC-8/-7)" },
  { value: "Europe/Madrid",            label: "Madrid (UTC+1/+2)" },
];

const COUNTRIES = [
  "Guatemala", "México", "Colombia", "Perú", "Chile", "Argentina",
  "Brasil", "Ecuador", "Venezuela", "Bolivia", "Paraguay", "Uruguay",
  "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panamá",
  "República Dominicana", "Cuba", "Puerto Rico", "España", "Estados Unidos",
];

const PLAN_LABELS = { trial: "Prueba", basic: "Básico", professional: "Profesional", enterprise: "Empresarial" };
const PLAN_COLORS = { trial: "#d97706", basic: "#2563eb", professional: "#7c3aed", enterprise: "#0d9488" };
const PLAN_BG     = { trial: "#fffbeb", basic: "#eff6ff", professional: "#f5f3ff", enterprise: "#f0fdfa" };

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, description, children }) {
  return (
    <div className="rounded-2xl" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
      <div className="px-6 py-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <h2 className="text-base font-semibold" style={{ color: "#0f172a" }}>{title}</h2>
        {description && <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
}

function SaveBar({ dirty, saving, onSave, onReset }) {
  if (!dirty) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
      style={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", minWidth: 320 }}>
      <span className="text-sm" style={{ color: "#94a3b8" }}>Tienes cambios sin guardar</span>
      <div className="flex-1" />
      <button onClick={onReset} className="text-sm px-3 py-1.5 rounded-lg"
        style={{ color: "#94a3b8" }}>
        Descartar
      </button>
      <button onClick={onSave} disabled={saving}
        className="text-sm font-medium px-4 py-1.5 rounded-lg"
        style={{ backgroundColor: saving ? "#3b82f6" : "#2563eb", color: "#fff", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { organization, fetchMe } = useAuth();

  const [form,         setForm]         = useState(null);
  const [original,     setOriginal]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [uploadingLogo,setUploadingLogo]= useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!organization) return;
    const initial = {
      name:        organization.name        || "",
      phone:       organization.phone       || "",
      address:     organization.address     || "",
      city:        organization.city        || "",
      country:     organization.country     || "",
      timezone:    organization.timezone    || "UTC",
      clinic_type: organization.clinic_type || "general",
    };
    setForm(initial);
    setOriginal(initial);
  }, [organization]);

  const dirty = form && original && JSON.stringify(form) !== JSON.stringify(original);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleReset = () => setForm(original);

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones en cliente
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen (PNG, JPG, SVG, WebP)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 2 MB");
      return;
    }

    // Preview instantáneo
    setLogoPreview(URL.createObjectURL(file));
    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.patch("/api/v1/organization/upload_logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchMe();
      toast.success("Logo actualizado correctamente");
    } catch (err) {
      setLogoPreview(null);
      toast.error(err.response?.data?.error || "Error al subir el logo");
    } finally {
      setUploadingLogo(false);
      // Limpia el input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.patch("/api/v1/organization", { organization: form });
      await fetchMe();
      setOriginal(form);
      toast.success("Configuración guardada correctamente");
    } catch (err) {
      const msg = err.response?.data?.errors?.join(", ") || "Error al guardar la configuración.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputCls   = "w-full text-sm rounded-xl px-3.5 py-2.5 outline-none transition-shadow focus:ring-2 focus:ring-blue-500";
  const inputStyle = { border: "1px solid #e2e8f0", color: "#0f172a", backgroundColor: "#fff" };

  if (!form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0f172a" }}>Configuración</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Administra la información y preferencias de tu organización.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* ── Plan & licencia (solo lectura) ── */}
      <Section title="Plan y licencia" description="Información sobre tu suscripción actual.">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: PLAN_BG[organization?.plan] || "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[organization?.plan] || "#94a3b8" }} />
            <span className="text-sm font-semibold" style={{ color: PLAN_COLORS[organization?.plan] || "#64748b" }}>
              Plan {PLAN_LABELS[organization?.plan] || organization?.plan}
            </span>
          </div>
          {organization?.on_trial && (
            <div className="text-sm px-4 py-3 rounded-xl"
              style={{ backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
              {organization.trial_expired
                ? "⚠️ Período de prueba expirado"
                : `⏳ ${organization.trial_days_remaining} días restantes de prueba`}
            </div>
          )}
          {organization?.features?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {organization.features.map(f => (
                <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── Información general ── */}
      <Section title="Información general" description="Nombre, tipo de clínica y datos de contacto principales.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nombre de la organización" hint="Aparece en el encabezado y en los PDFs generados.">
            <input value={form.name} onChange={e => set("name", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="Mi Clínica" />
          </Field>

          <Field label="Tipo de clínica / negocio">
            <select value={form.clinic_type} onChange={e => set("clinic_type", e.target.value)}
              className={inputCls} style={inputStyle}>
              {CLINIC_TYPES.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Correo electrónico" hint="El email de la organización no puede modificarse.">
            <input type="email" value={organization?.email || ""} readOnly
              className={inputCls}
              style={{ ...inputStyle, backgroundColor: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" }} />
          </Field>

          <Field label="Teléfono">
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="+502 1234 5678" />
          </Field>
        </div>
      </Section>

      {/* ── Identidad visual ── */}
      <Section title="Identidad visual" description="Logo que aparece en el PDF de expedientes y en el encabezado del sistema.">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleLogoSelect}
          style={{ display: "none" }}
        />

        <div className="flex items-center gap-6">
          {/* Preview actual */}
          <div className="flex-shrink-0 relative">
            {(logoPreview || organization?.logo_url) ? (
              <img
                src={logoPreview || organization?.logo_url}
                alt="Logo"
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: "1px solid #e2e8f0" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
                style={{ backgroundColor: "#2563eb", color: "#fff" }}>
                {form.name?.[0] || "C"}
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#374151" }}>Logo de la organización</p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                PNG, JPG, SVG o WebP · Máximo 2 MB · Recomendado: 400×400 px o mayor
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                style={{
                  backgroundColor: uploadingLogo ? "#f1f5f9" : "#ffffff",
                  color: uploadingLogo ? "#94a3b8" : "#374151",
                  border: "1px solid #e2e8f0",
                  cursor: uploadingLogo ? "not-allowed" : "pointer",
                }}
              >
                {uploadingLogo ? "Subiendo…" : "Subir imagen"}
              </button>

              {(logoPreview || organization?.logo_url) && !uploadingLogo && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.patch("/api/v1/organization", { organization: { logo: "" } });
                      setLogoPreview(null);
                      await fetchMe();
                      toast.success("Logo eliminado");
                    } catch {
                      toast.error("Error al eliminar el logo");
                    }
                  }}
                  className="text-sm px-3 py-2 rounded-xl transition-colors"
                  style={{ color: "#dc2626", backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
                >
                  Eliminar
                </button>
              )}
            </div>

            {!logoPreview && !organization?.logo_url && (
              <p className="text-xs" style={{ color: "#cbd5e1" }}>
                Sin logo — se mostrará la inicial del nombre de tu organización.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ── Ubicación ── */}
      <Section title="Ubicación" description="Dirección física de tu clínica.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Field label="Dirección">
              <input value={form.address} onChange={e => set("address", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="4a Calle 5-55 Zona 1" />
            </Field>
          </div>
          <Field label="Ciudad">
            <input value={form.city} onChange={e => set("city", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="Ciudad de Guatemala" />
          </Field>
          <Field label="País">
            <select value={form.country} onChange={e => set("country", e.target.value)}
              className={inputCls} style={inputStyle}>
              <option value="">Seleccionar...</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Preferencias ── */}
      <Section title="Preferencias del sistema" description="Zona horaria usada para las citas y notificaciones.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Zona horaria" hint="Afecta la hora mostrada en citas, recordatorios y PDFs.">
            <select value={form.timezone} onChange={e => set("timezone", e.target.value)}
              className={inputCls} style={inputStyle}>
              {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Info de cuenta (solo lectura) ── */}
      <Section title="Información de cuenta" description="Datos técnicos de tu organización.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Slug / URL",   value: organization?.slug },
            { label: "Subdominio",   value: organization?.subdomain },
            { label: "Estado",       value: organization?.status === "active" ? "Activa" : organization?.status },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-4" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#94a3b8" }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: "#334155" }}>{value || "—"}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Floating save bar */}
      <SaveBar dirty={dirty} saving={saving} onSave={handleSave} onReset={handleReset} />
    </div>
  );
}
