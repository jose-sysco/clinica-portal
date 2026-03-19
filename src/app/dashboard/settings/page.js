"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const CLINIC_TYPES = [
  { value: "veterinary", label: "Clínica Veterinaria" },
  { value: "pediatric",  label: "Pediatría" },
  { value: "general",    label: "Medicina General" },
  { value: "dental",     label: "Odontología" },
  { value: "psychology", label: "Psicología" },
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

  const [form,    setForm]    = useState(null);
  const [original, setOriginal] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!organization) return;
    const initial = {
      name:        organization.name        || "",
      email:       organization.email       || "",
      phone:       organization.phone       || "",
      address:     organization.address     || "",
      city:        organization.city        || "",
      country:     organization.country     || "",
      timezone:    organization.timezone    || "UTC",
      clinic_type: organization.clinic_type || "general",
      logo:        organization.logo        || "",
    };
    setForm(initial);
    setOriginal(initial);
  }, [organization]);

  const dirty = form && original && JSON.stringify(form) !== JSON.stringify(original);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleReset = () => setForm(original);

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
              {CLINIC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Correo electrónico" hint="Se usa para notificaciones y recordatorios.">
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="contacto@miclinica.com" />
          </Field>

          <Field label="Teléfono">
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="+502 1234 5678" />
          </Field>
        </div>
      </Section>

      {/* ── Identidad visual ── */}
      <Section title="Identidad visual" description="Logo que aparece en el PDF de expedientes y en el encabezado del sistema.">
        <div className="flex items-start gap-6">
          {/* Preview */}
          <div className="flex-shrink-0">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover"
                style={{ border: "1px solid #e2e8f0" }}
                onError={e => { e.target.style.display = "none"; }} />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: "#2563eb", color: "#fff" }}>
                {form.name?.[0] || "C"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <Field label="URL del logo" hint="Pega la URL de una imagen (PNG, JPG o SVG). Recomendado: 200×200 px o mayor.">
              <input type="url" value={form.logo} onChange={e => set("logo", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="https://..." />
            </Field>
            {!form.logo && (
              <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                Sin logo configurado — se usará la inicial del nombre de la organización.
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
