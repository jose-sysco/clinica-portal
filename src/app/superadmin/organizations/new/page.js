"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import superadminApi from "@/lib/superadminApi";
import { toast } from "sonner";

const CLINIC_TYPE_OPTIONS = [
  { value: "veterinary",    label: "Veterinaria" },
  { value: "pediatric",     label: "Pediatría" },
  { value: "general",       label: "Medicina General" },
  { value: "dental",        label: "Odontología" },
  { value: "psychology",    label: "Psicología" },
  { value: "physiotherapy", label: "Fisioterapia" },
  { value: "nutrition",     label: "Nutrición" },
  { value: "beauty",        label: "Estética y Belleza" },
  { value: "coaching",      label: "Coaching" },
  { value: "legal",         label: "Servicios Legales" },
  { value: "fitness",       label: "Fitness y Deporte" },
];

const TIMEZONE_OPTIONS = [
  { value: "America/Guatemala",    label: "Guatemala (UTC-6)" },
  { value: "America/Mexico_City",  label: "Ciudad de México (UTC-6/-5)" },
  { value: "America/Tegucalpa",    label: "Honduras (UTC-6)" },
  { value: "America/El_Salvador",  label: "El Salvador (UTC-6)" },
  { value: "America/Managua",      label: "Nicaragua (UTC-6)" },
  { value: "America/Costa_Rica",   label: "Costa Rica (UTC-6)" },
  { value: "America/Panama",       label: "Panamá (UTC-5)" },
  { value: "America/Bogota",       label: "Colombia (UTC-5)" },
  { value: "America/Lima",         label: "Perú (UTC-5)" },
  { value: "America/Santiago",     label: "Chile (UTC-4/-3)" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (UTC-3)" },
  { value: "America/Sao_Paulo",    label: "Brasil (UTC-3)" },
  { value: "America/New_York",     label: "Nueva York (UTC-5/-4)" },
  { value: "America/Los_Angeles",  label: "Los Ángeles (UTC-8/-7)" },
  { value: "Europe/Madrid",        label: "España (UTC+1/+2)" },
];

const inputStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  color: "#f1f5f9",
};

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1.5" style={{ color: "#94a3b8" }}>
        {label}
        {hint && <span className="ml-1.5 font-normal" style={{ color: "#475569" }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function NewOrganizationPage() {
  const router = useRouter();

  const [org, setOrg] = useState({
    name:        "",
    email:       "",
    phone:       "",
    address:     "",
    city:        "",
    country:     "Guatemala",
    timezone:    "America/Guatemala",
    clinic_type: "general",
  });

  const [admin, setAdmin] = useState({
    first_name: "",
    last_name:  "",
    email:      "",
    password:   "",
  });

  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (!org.name || !org.email) {
      setErrors(["Nombre y email de la organización son obligatorios"]);
      return;
    }
    if (!admin.first_name || !admin.last_name) {
      setErrors(["Nombre y apellido del administrador son obligatorios"]);
      return;
    }
    if (!admin.password || admin.password.length < 6) {
      setErrors(["La contraseña del admin debe tener al menos 6 caracteres"]);
      return;
    }

    setSaving(true);
    try {
      const payload = { organization: org, admin };
      if (!admin.email) delete payload.admin.email;

      const r = await superadminApi.post("/api/superadmin/organizations", payload);
      toast.success(`Organización "${r.data.name}" creada correctamente`);
      router.push(`/superadmin/organizations/${r.data.id}`);
    } catch (err) {
      const errs = err.response?.data?.errors || ["Error al crear la organización"];
      setErrors(errs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/superadmin/organizations")}
          className="text-xs mb-3 flex items-center gap-1"
          style={{ color: "#475569" }}
        >
          ← Volver a organizaciones
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Nueva organización</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Se creará en plan Trial (15 días). Podés cambiar el plan después desde Licencia.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#450a0a33", border: "1px solid #7f1d1d" }}>
          {errors.map((e, i) => (
            <p key={i} className="text-sm" style={{ color: "#fca5a5" }}>{e}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos de la organización */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
            Datos de la organización
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre de la clínica *">
              <input
                type="text"
                value={org.name}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                placeholder="Clínica San Rafael"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Email de la organización *">
              <input
                type="email"
                value={org.email}
                onChange={(e) => setOrg({ ...org, email: e.target.value })}
                placeholder="contacto@clinica.com"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Teléfono">
              <input
                type="text"
                value={org.phone}
                onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                placeholder="+502 1234-5678"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
              />
            </Field>

            <Field label="Tipo de clínica *">
              <select
                value={org.clinic_type}
                onChange={(e) => setOrg({ ...org, clinic_type: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
              >
                {CLINIC_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Ciudad">
              <input
                type="text"
                value={org.city}
                onChange={(e) => setOrg({ ...org, city: e.target.value })}
                placeholder="Ciudad de Guatemala"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
              />
            </Field>

            <Field label="País">
              <input
                type="text"
                value={org.country}
                onChange={(e) => setOrg({ ...org, country: e.target.value })}
                placeholder="Guatemala"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
              />
            </Field>

            <Field label="Dirección" hint="(opcional)">
              <input
                type="text"
                value={org.address}
                onChange={(e) => setOrg({ ...org, address: e.target.value })}
                placeholder="3a Av. 12-65, Zona 10"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
              />
            </Field>

            <Field label="Zona horaria *">
              <select
                value={org.timezone}
                onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
              >
                {TIMEZONE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Administrador inicial */}
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
              Administrador inicial
            </p>
            <p className="text-xs mt-1" style={{ color: "#334155" }}>
              Si no ingresás un email para el admin, se usará el email de la organización.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre *">
              <input
                type="text"
                value={admin.first_name}
                onChange={(e) => setAdmin({ ...admin, first_name: e.target.value })}
                placeholder="María"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Apellido *">
              <input
                type="text"
                value={admin.last_name}
                onChange={(e) => setAdmin({ ...admin, last_name: e.target.value })}
                placeholder="García"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Email del admin" hint="(deja vacío para usar el de la org)">
              <input
                type="email"
                value={admin.email}
                onChange={(e) => setAdmin({ ...admin, email: e.target.value })}
                placeholder={org.email || "admin@clinica.com"}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
              />
            </Field>

            <Field label="Contraseña inicial *" hint="(mín. 6 caracteres)">
              <input
                type="password"
                value={admin.password}
                onChange={(e) => setAdmin({ ...admin, password: e.target.value })}
                placeholder="••••••••"
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={inputStyle}
                required
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
          >
            {saving ? "Creando..." : "Crear organización"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/superadmin/organizations")}
            className="text-sm px-4 py-2.5 rounded-lg"
            style={{ color: "#64748b", border: "1px solid #334155" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
