"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getConfig } from "@/lib/clinicConfig";
import api from "@/lib/api";
import { toast } from "sonner";
import AccessDenied from "@/components/AccessDenied";

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

const PLAN_COLORS = { trial: "#d97706", basic: "#2563eb", professional: "#7c3aed", enterprise: "#0d9488" };
const PLAN_BG     = { trial: "#fffbeb", basic: "#eff6ff", professional: "#f5f3ff", enterprise: "#f0fdfa" };
const PLAN_BORDER = { trial: "#fde68a", basic: "#bfdbfe", professional: "#ddd6fe", enterprise: "#99f6e4" };

function UsageBar({ label, used, max, color = "#2563eb" }) {
  if (max == null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: "#374151" }}>{label}</span>
          <span className="text-xs" style={{ color: "#94a3b8" }}>{used} · Ilimitado</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: "#f1f5f9" }}>
          <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: color, opacity: 0.3 }} />
        </div>
      </div>
    );
  }
  const pct     = Math.min((used / max) * 100, 100);
  const warning = pct >= 80;
  const barColor = pct >= 100 ? "#ef4444" : warning ? "#f59e0b" : color;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: "#374151" }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: barColor }}>{used} / {max}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: "#f1f5f9" }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {pct >= 90 && (
        <p className="text-xs mt-1" style={{ color: barColor }}>
          {pct >= 100 ? "Límite alcanzado — actualiza tu plan para continuar agregando." : `Casi en el límite (${Math.round(pct)}% usado).`}
        </p>
      )}
    </div>
  );
}

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
  const { user, organization, fetchMe } = useAuth();
  const config = getConfig(organization?.clinic_type);

  const [form,         setForm]         = useState(null);
  const [original,     setOriginal]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [uploadingLogo,setUploadingLogo]= useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchMe(); }, []);

  useEffect(() => {
    if (!organization) return;
    const initial = {
      name:          organization.name          || "",
      phone:         organization.phone         || "",
      address:       organization.address       || "",
      city:          organization.city          || "",
      country:       organization.country       || "",
      timezone:      organization.timezone      || "UTC",
      clinic_type:   organization.clinic_type   || "general",
      primary_color: organization.primary_color || "",
    };
    setForm(initial);
    setOriginal(initial);
  }, [organization]);

  if (user && user.role !== "admin") return <AccessDenied />;

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
      <Section title="Plan y licencia" description="Información sobre tu suscripción actual y uso de recursos.">
        <div className="space-y-5">
          {/* Plan badge + trial banner */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{
                backgroundColor: PLAN_BG[organization?.plan]    || "#f8fafc",
                border:          `1px solid ${PLAN_BORDER[organization?.plan] || "#e2e8f0"}`,
              }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAN_COLORS[organization?.plan] || "#94a3b8" }} />
              <span className="text-sm font-semibold" style={{ color: PLAN_COLORS[organization?.plan] || "#64748b" }}>
                {organization?.plan_display_name || organization?.plan}
              </span>
            </div>

            {organization?.on_trial && !organization?.trial_expired && (
              <div className="text-sm px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
                ⏳ {organization.trial_days_remaining} día{organization.trial_days_remaining !== 1 ? "s" : ""} restantes de prueba
              </div>
            )}
            {organization?.trial_expired && (
              <div className="text-sm px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                ⚠️ Período de prueba expirado
              </div>
            )}
          </div>

          {/* Usage bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl"
            style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <UsageBar
              label={config.staffLabel}
              used={organization?.doctors_used ?? 0}
              max={organization?.plan_max_doctors ?? null}
              color={PLAN_COLORS[organization?.plan] || "#2563eb"}
            />
            <UsageBar
              label="Pacientes"
              used={organization?.patients_used ?? 0}
              max={organization?.plan_max_patients ?? null}
              color={PLAN_COLORS[organization?.plan] || "#2563eb"}
            />
          </div>

          {/* Pricing + features row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            {(organization?.plan_price_monthly || organization?.plan_price_monthly_usd) && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: "#94a3b8" }}>Precio mensual</p>
                <p className="text-base font-semibold" style={{ color: "#0f172a" }}>
                  {organization.plan_price_monthly
                    ? `Q${Number(organization.plan_price_monthly).toFixed(2)}`
                    : `$${Number(organization.plan_price_monthly_usd).toFixed(2)}`}
                  {organization.plan_price_monthly && organization.plan_price_monthly_usd && (
                    <span className="text-xs font-normal ml-1.5" style={{ color: "#94a3b8" }}>
                      (${Number(organization.plan_price_monthly_usd).toFixed(2)} USD)
                    </span>
                  )}
                </p>
              </div>
            )}

            {organization?.features?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {organization.features.map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Upgrade CTA */}
          {organization?.plan !== "enterprise" && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe" }}>
              <p className="text-sm" style={{ color: "#5b21b6" }}>
                Actualiza tu plan para desbloquear más doctores, pacientes y funcionalidades.
              </p>
              <a href="mailto:soporte@clinicaportal.com?subject=Actualizar plan"
                className="text-sm font-semibold whitespace-nowrap ml-4 px-4 py-2 rounded-lg"
                style={{ backgroundColor: "#7c3aed", color: "#fff" }}>
                Actualizar plan
              </a>
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
            <div className={inputCls} style={{ ...inputStyle, backgroundColor: "#f8fafc", color: "#475569", cursor: "not-allowed", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>{organization?.email || "—"}</span>
              <span className="text-xs" style={{ color: "#cbd5e1", marginLeft: "auto" }}>Solo lectura</span>
            </div>
          </Field>

          <Field label="Teléfono">
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="+502 1234 5678" />
          </Field>
        </div>
      </Section>

      {/* ── Identidad visual ── */}
      <Section title="Identidad visual" description="Logo y color principal que aparecen en el encabezado del sistema y en los PDFs.">
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

        {/* Separador */}
        <div className="my-5" style={{ borderTop: "1px solid #f1f5f9" }} />

        {/* Color principal */}
        {organization?.features?.includes("custom_branding") ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "#374151" }}>Color principal</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                Personaliza el color del encabezado y los elementos de navegación activos.
              </p>
            </div>

            {/* Swatches rápidos */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { hex: "#2563eb", label: "Azul (defecto)" },
                { hex: "#7c3aed", label: "Púrpura" },
                { hex: "#0d9488", label: "Teal" },
                { hex: "#059669", label: "Esmeralda" },
                { hex: "#dc2626", label: "Rojo" },
                { hex: "#d97706", label: "Ámbar" },
                { hex: "#0284c7", label: "Cielo" },
                { hex: "#db2777", label: "Rosa" },
              ].map(({ hex, label }) => {
                const selected = (form.primary_color || "#2563eb") === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    title={label}
                    onClick={() => set("primary_color", hex)}
                    className="w-8 h-8 rounded-lg transition-all flex-shrink-0"
                    style={{
                      backgroundColor: hex,
                      border: selected ? `3px solid ${hex}` : "2px solid transparent",
                      boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${hex}` : "0 1px 3px rgba(0,0,0,0.15)",
                      transform: selected ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                );
              })}

              {/* Selector personalizado */}
              <div className="relative w-8 h-8 flex-shrink-0" title="Color personalizado">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer"
                  style={{
                    background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
                    border: "2px solid #e2e8f0",
                  }}
                />
                <input
                  type="color"
                  value={form.primary_color || "#2563eb"}
                  onChange={e => set("primary_color", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  title="Elige un color personalizado"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-lg flex-shrink-0"
                style={{ backgroundColor: form.primary_color || "#2563eb" }}
              />
              <span className="text-xs font-mono" style={{ color: "#64748b" }}>
                {form.primary_color || "#2563eb"}
              </span>
              {form.primary_color && form.primary_color !== "#2563eb" && (
                <button
                  type="button"
                  onClick={() => set("primary_color", "")}
                  className="text-xs"
                  style={{ color: "#94a3b8" }}
                >
                  Restaurar defecto
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div className="flex gap-1.5">
              {["#2563eb","#7c3aed","#0d9488","#dc2626"].map(c => (
                <div key={c} className="w-6 h-6 rounded-md opacity-30" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "#64748b" }}>Color principal</p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>Disponible en el plan Enterprise</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4" }}>
              Enterprise
            </span>
          </div>
        )}
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
