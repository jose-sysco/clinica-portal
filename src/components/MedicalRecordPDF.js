"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

// ── Styles ────────────────────────────────────────────────────────────────────

const C = {
  blue: "#2563eb",
  blueBg: "#eff6ff",
  dark: "#0f172a",
  mid: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  border: "#e2e8f0",
  bgLight: "#f8fafc",
  white: "#ffffff",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  amber: "#d97706",
  amberBg: "#fffbeb",
  violet: "#7c3aed",
  violetBg: "#f5f3ff",
  teal: "#0d9488",
  tealBg: "#f0fdfa",
  red: "#dc2626",
};

const SOAP_COLOR = {
  soap_subjective: {
    letter: "S",
    title: "Subjetivo",
    color: C.blue,
    bg: C.blueBg,
  },
  soap_objective: {
    letter: "O",
    title: "Objetivo",
    color: C.teal,
    bg: C.tealBg,
  },
  soap_assessment: {
    letter: "A",
    title: "Evaluación / Diagnóstico",
    color: C.amber,
    bg: C.amberBg,
  },
  soap_plan: { letter: "P", title: "Plan", color: C.violet, bg: C.violetBg },
};

const VITALS_META = [
  { field: "weight", label: "Peso", unit: "lb" },
  { field: "height", label: "Talla", unit: "cm" },
  { field: "temperature", label: "Temperatura", unit: "°C" },
  { field: "oxygen_saturation", label: "SpO₂", unit: "%" },
  { field: "heart_rate", label: "F. cardíaca", unit: "ppm" },
  { field: "respiratory_rate", label: "F. respiratoria", unit: "rpm" },
  { field: "blood_pressure_systolic", label: "Presión sist.", unit: "mmHg" },
  { field: "blood_pressure_diastolic", label: "Presión diast.", unit: "mmHg" },
];

const CLINIC_LABEL = {
  veterinary: "Clínica Veterinaria",
  pediatric: "Pediatría",
  general: "Medicina General",
  dental: "Odontología",
  psychology: "Psicología",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.dark,
    backgroundColor: C.white,
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoLetter: { color: C.white, fontSize: 18, fontFamily: "Helvetica-Bold" },
  orgName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.dark },
  orgType: { fontSize: 9, color: C.muted, marginTop: 2 },
  rxBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.blueBg,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  rxText: { fontFamily: "Helvetica-Bold", color: C.blue, fontSize: 11 },
  rxId: { color: C.blue, fontSize: 9, marginLeft: 4 },

  // Title
  titleRow: { marginBottom: 14 },
  titleText: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.dark },
  dateText: {
    fontSize: 9,
    color: C.muted,
    marginTop: 3,
    textTransform: "capitalize",
  },

  // Meta cards row
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  metaCard: {
    flex: 1,
    backgroundColor: C.bgLight,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.faint,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.dark },
  metaValueBlue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.blue },

  // Section
  section: { marginBottom: 10 },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.faint,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  // Vitals
  vitalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  vitalCard: {
    width: "23%",
    backgroundColor: C.bgLight,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
  },
  vitalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 1,
  },
  vitalUnit: { fontSize: 7, color: C.faint },
  vitalLabel: { fontSize: 7, color: C.muted, marginTop: 2 },

  // SOAP
  soapCard: {
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  soapHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  soapLetter: { fontSize: 12, fontFamily: "Helvetica-Bold", marginRight: 8 },
  soapTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.dark },
  soapBody: {
    backgroundColor: C.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  soapText: { fontSize: 9.5, color: C.mid, lineHeight: 1.6 },

  // Medications / notes
  contentCard: {
    backgroundColor: C.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  contentText: { fontSize: 9.5, color: C.mid, lineHeight: 1.6 },
  noteCard: {
    backgroundColor: C.amberBg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 10,
  },
  noteText: { fontSize: 9.5, color: "#78350f", lineHeight: 1.6 },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginVertical: 10,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: C.faint },
  footerPage: { fontSize: 8, color: C.faint },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(
  iso,
  opts = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-GT", opts);
}

function fmtShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── PDF Document ──────────────────────────────────────────────────────────────

function MedicalRecordDocument({ record, organization, config }) {
  const isSoap = Object.keys(SOAP_COLOR).some((f) => record?.[f]);
  const hasVitals = VITALS_META.some(
    (v) => record?.[v.field] != null && record?.[v.field] !== "",
  );
  const vitals = VITALS_META.filter(
    (v) => record?.[v.field] != null && record?.[v.field] !== "",
  );
  const clinicLabel = CLINIC_LABEL[organization?.clinic_type] || "Clínica";

  const brand = organization?.primary_color || C.blue;
  const brandBg = `${brand}18`;
  const brandBdr = `${brand}55`;

  return (
    <Document title={`Expediente #${record?.id}`} author={organization?.name}>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[s.logoBox, { backgroundColor: brand }]}>
              <Text style={s.logoLetter}>{organization?.name?.[0] || "C"}</Text>
            </View>
            <View>
              <Text style={s.orgName}>{organization?.name}</Text>
              <Text style={s.orgType}>{clinicLabel}</Text>
            </View>
          </View>
          <View
            style={[
              s.rxBadge,
              { backgroundColor: brandBg, borderColor: brandBdr },
            ]}
          >
            <Text style={[s.rxText, { color: brand }]}>Rx</Text>
            <Text style={[s.rxId, { color: brand }]}>#{record?.id}</Text>
          </View>
        </View>

        {/* ── Title ── */}
        <View style={s.titleRow}>
          <Text style={s.titleText}>Expediente Clínico</Text>
          <Text style={s.dateText}>{fmtDate(record?.created_at)}</Text>
        </View>

        {/* ── Meta cards ── */}
        <View style={s.metaRow}>
          <View style={s.metaCard}>
            <Text style={s.metaLabel}>
              {config?.doctorLabel || "Doctor / Profesional"}
            </Text>
            <Text style={s.metaValue}>{record?.doctor?.full_name || "—"}</Text>
          </View>
          <View style={s.metaCard}>
            <Text style={s.metaLabel}>
              {config?.patientLabel || "Paciente"}
            </Text>
            <Text style={s.metaValue}>{record?.patient?.name || "—"}</Text>
          </View>
          <View
            style={[
              s.metaCard,
              record?.next_visit_date
                ? { backgroundColor: brandBg, borderColor: brandBdr }
                : {},
            ]}
          >
            <Text style={s.metaLabel}>Próxima visita</Text>
            <Text
              style={
                record?.next_visit_date
                  ? [s.metaValueBlue, { color: brand }]
                  : s.metaValue
              }
            >
              {record?.next_visit_date
                ? fmtShort(record.next_visit_date)
                : "No programada"}
            </Text>
          </View>
        </View>

        {/* ── Signos vitales ── */}
        {hasVitals && (
          <View style={[s.section, { marginBottom: 14 }]}>
            <Text style={s.sectionLabel}>Signos Vitales</Text>
            <View style={s.vitalsGrid}>
              {vitals.map(({ field, label, unit }) => (
                <View key={field} style={s.vitalCard}>
                  <Text style={s.vitalValue}>{record[field]}</Text>
                  <Text style={s.vitalUnit}>{unit}</Text>
                  <Text style={s.vitalLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── SOAP ── */}
        {isSoap && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Nota Clínica — Formato SOAP</Text>
            {Object.entries(SOAP_COLOR).map(([field, cfg]) => {
              const content = record?.[field];
              if (!content) return null;
              return (
                <View key={field} style={s.soapCard}>
                  <View style={[s.soapHeader, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.soapLetter, { color: cfg.color }]}>
                      {cfg.letter}
                    </Text>
                    <Text style={s.soapTitle}>{cfg.title}</Text>
                  </View>
                  <View style={s.soapBody}>
                    <Text style={s.soapText}>{content}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Legacy format ── */}
        {!isSoap && record?.diagnosis && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Diagnóstico</Text>
            <View style={s.contentCard}>
              <Text style={s.contentText}>{record.diagnosis}</Text>
            </View>
          </View>
        )}
        {!isSoap && record?.treatment && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Tratamiento</Text>
            <View style={s.contentCard}>
              <Text style={s.contentText}>{record.treatment}</Text>
            </View>
          </View>
        )}

        {/* ── Medicamentos ── */}
        {record?.medications && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Medicamentos Recetados</Text>
            <View style={s.contentCard}>
              <Text style={s.contentText}>{record.medications}</Text>
            </View>
          </View>
        )}

        {/* ── Notas ── */}
        {record?.notes && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Notas Adicionales</Text>
            <View style={s.noteCard}>
              <Text style={s.noteText}>{record.notes}</Text>
            </View>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generado el{" "}
            {fmtDate(new Date().toISOString(), {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {organization?.name}
          </Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Pág. ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ── Download Button ───────────────────────────────────────────────────────────

export default function DownloadMedicalRecordPDF({
  record,
  organization,
  config,
}) {
  if (!record) return null;

  const fileName = `expediente-${record.id}-${record.patient?.name?.replace(/\s+/g, "-") || "paciente"}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <MedicalRecordDocument
          record={record}
          organization={organization}
          config={config}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: loading ? "#f1f5f9" : "#ffffff",
            color: loading ? "#94a3b8" : "#64748b",
            border: "1px solid #e2e8f0",
            cursor: loading ? "wait" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.color = "#0f172a";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = loading
              ? "#f1f5f9"
              : "#ffffff";
            e.currentTarget.style.color = loading ? "#94a3b8" : "#64748b";
          }}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block" />
              Preparando PDF...
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
