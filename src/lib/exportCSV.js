/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 *
 * @param {string}   filename  - File name without extension
 * @param {string[]} headers   - Column headers (display labels)
 * @param {string[]} keys      - Dot-notation keys to extract from each row object
 * @param {Object[]} rows      - Array of data objects
 */
export function downloadCSV(filename, headers, keys, rows) {
  const get = (obj, path) => {
    const value = path.split(".").reduce((acc, k) => acc?.[k], obj);
    if (value == null) return "";
    return String(value).replace(/"/g, '""');
  };

  const headerRow = headers.map(h => `"${h}"`).join(",");
  const dataRows  = rows.map(row => keys.map(k => `"${get(row, k)}"`).join(","));
  const csv       = [headerRow, ...dataRows].join("\n");
  const bom       = "\uFEFF"; // UTF-8 BOM — ensures Excel opens accented chars correctly

  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Column definitions per entity ─────────────────────────────────────────────

export const PATIENTS_CSV = {
  headers: ["ID", "Nombre", "Tipo", "Especie", "Raza", "Género", "Fecha nac.", "Peso (kg)", "Tipo sangre", "Alergias", "Condiciones crónicas", "Responsable", "Estado"],
  keys:    ["id", "name", "patient_type", "species", "breed", "gender", "birthdate", "weight", "blood_type", "allergies", "chronic_conditions", "owner.full_name", "status"],
};

export const APPOINTMENTS_CSV = {
  headers: ["ID", "Fecha", "Hora inicio", "Hora fin", "Estado", "Tipo", "Motivo", "Doctor", "Paciente", "Responsable", "Teléfono responsable"],
  keys:    ["id", "_date", "_time_start", "_time_end", "status", "appointment_type", "reason", "doctor.full_name", "patient.name", "owner.full_name", "owner.phone"],
};

export const WAITLIST_CSV = {
  headers: ["ID", "Paciente", "Doctor", "Especialidad", "Fecha preferida", "Estado", "Notas", "Registrado"],
  keys:    ["id", "patient.name", "doctor.full_name", "doctor.specialty", "preferred_date", "status", "notes", "created_at"],
};

// ── Status translations ────────────────────────────────────────────────────────

const STATUS_ES = {
  pending:    "Pendiente",
  confirmed:  "Confirmada",
  in_progress:"En progreso",
  completed:  "Completada",
  cancelled:  "Cancelada",
  no_show:    "No se presentó",
  waiting:    "En espera",
  notified:   "Notificado",
  booked:     "Agendado",
  expired:    "Expirado",
  first_visit:"Primera visita",
  follow_up:  "Seguimiento",
  emergency:  "Emergencia",
  routine:    "Rutina",
  active:     "Activo",
  inactive:   "Inactivo",
};

/**
 * Normalise appointment rows to add flat _date / _time_start / _time_end
 * and translate status/type enums to Spanish.
 */
export function prepareAppointments(rows) {
  return rows.map(r => ({
    ...r,
    _date:       r.scheduled_at ? r.scheduled_at.slice(0, 10) : "",
    _time_start: r.scheduled_at ? r.scheduled_at.slice(11, 16) : "",
    _time_end:   r.ends_at      ? r.ends_at.slice(11, 16)      : "",
    status:           STATUS_ES[r.status]           || r.status,
    appointment_type: STATUS_ES[r.appointment_type] || r.appointment_type,
  }));
}

export function preparePatients(rows) {
  return rows.map(r => ({
    ...r,
    status: STATUS_ES[r.status] || r.status,
  }));
}

export function prepareWaitlist(rows) {
  return rows.map(r => ({
    ...r,
    status:     STATUS_ES[r.status] || r.status,
    created_at: r.created_at ? r.created_at.slice(0, 10) : "",
  }));
}
