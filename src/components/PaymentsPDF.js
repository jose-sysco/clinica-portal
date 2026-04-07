"use client";

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

const METHOD_LABEL = {
  cash:     "Efectivo",
  card:     "Tarjeta",
  transfer: "Transferencia",
  other:    "Otro",
};

const CLINIC_LABEL = {
  veterinary:    "Clínica Veterinaria",
  pediatric:     "Pediatría",
  general:       "Medicina General",
  dental:        "Odontología",
  psychology:    "Psicología",
  physiotherapy: "Fisioterapia",
  nutrition:     "Nutrición",
  beauty:        "Estética y Belleza",
  coaching:      "Coaching",
  legal:         "Servicios Legales",
  fitness:       "Fitness y Deporte",
};

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtCurrency(val) {
  return `Q${Number(val || 0).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Document ──────────────────────────────────────────────────────────────────

function PaymentsDocument({ payments, totals, filters, organization, logoBase64 }) {
  const brand     = organization?.primary_color || "#2563eb";
  const brandBg   = `${brand}18`;
  const brandBdr  = `${brand}55`;
  const clinicLabel = CLINIC_LABEL[organization?.clinic_type] || "Clínica";

  const C = {
    dark: "#0f172a", mid: "#334155", muted: "#64748b", faint: "#94a3b8",
    border: "#e2e8f0", bgLight: "#f8fafc", white: "#ffffff",
    green: "#16a34a", greenBg: "#f0fdf4",
  };

  const s = StyleSheet.create({
    page: {
      fontFamily: "Helvetica", fontSize: 10, color: C.dark,
      backgroundColor: C.white, paddingTop: 36, paddingBottom: 52, paddingHorizontal: 40,
    },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border,
    },
    logoBox: {
      width: 40, height: 40, borderRadius: 8, backgroundColor: brand,
      alignItems: "center", justifyContent: "center", marginRight: 10,
    },
    logoLetter: { color: "#ffffff", fontSize: 18, fontFamily: "Helvetica-Bold" },
    orgName:    { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.dark },
    orgType:    { fontSize: 9, color: C.muted, marginTop: 2 },
    badge: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: brandBg, borderRadius: 6,
      paddingVertical: 4, paddingHorizontal: 10,
      borderWidth: 1, borderColor: brandBdr,
    },
    badgeText: { fontFamily: "Helvetica-Bold", color: brand, fontSize: 10 },
    titleText: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 2 },
    subtitle:  { fontSize: 9, color: C.muted, marginBottom: 16 },
    // Totals row
    totalsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    totalCard: {
      flex: 1, backgroundColor: C.bgLight, borderRadius: 8,
      padding: 10, borderWidth: 1, borderColor: C.border,
    },
    totalLabel: {
      fontSize: 7, fontFamily: "Helvetica-Bold", color: C.faint,
      textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
    },
    totalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.dark },
    totalMain:  { fontSize: 13, fontFamily: "Helvetica-Bold", color: brand },
    // Table
    tableHeader: {
      flexDirection: "row", backgroundColor: C.bgLight,
      borderWidth: 1, borderColor: C.border, borderRadius: 6,
      paddingVertical: 6, paddingHorizontal: 8, marginBottom: 4,
    },
    tableRow: {
      flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    tableRowAlt: { backgroundColor: "#f8fafc" },
    th: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.faint, textTransform: "uppercase", letterSpacing: 0.5 },
    td: { fontSize: 9, color: C.mid },
    tdGreen: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.green },
    // Column widths
    colAmount:  { width: "13%" },
    colMethod:  { width: "13%" },
    colPatient: { width: "22%" },
    colDoctor:  { width: "20%" },
    colDate:    { width: "14%" },
    colNote:    { width: "18%" },
    // Footer
    footer: {
      position: "absolute", bottom: 20, left: 40, right: 40,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8,
    },
    footerText: { fontSize: 8, color: C.faint },
  });

  const dateRange = filters?.from && filters?.to
    ? `${fmtDate(filters.from)} — ${fmtDate(filters.to)}`
    : "Todos los períodos";

  return (
    <Document title="Reporte de Pagos" author={organization?.name}>
      <Page size="A4" style={s.page} orientation="landscape">

        {/* Header */}
        <View style={s.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {logoBase64 ? (
              <Image
                src={logoBase64}
                style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10, objectFit: "cover" }}
              />
            ) : (
              <View style={s.logoBox}>
                <Text style={s.logoLetter}>{organization?.name?.[0] || "C"}</Text>
              </View>
            )}
            <View>
              <Text style={s.orgName}>{organization?.name}</Text>
              <Text style={s.orgType}>{clinicLabel}</Text>
            </View>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>Reporte de Pagos</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.titleText}>Reporte de Pagos</Text>
        <Text style={s.subtitle}>{dateRange} · {payments.length} registros</Text>

        {/* Totals */}
        <View style={s.totalsRow}>
          {[
            { label: "Total recaudado", value: totals?.total,    main: true },
            { label: "Efectivo",        value: totals?.cash  },
            { label: "Tarjeta",         value: totals?.card  },
            { label: "Transferencia",   value: totals?.transfer },
            { label: "Otro",            value: totals?.other },
          ].map(c => (
            <View key={c.label} style={s.totalCard}>
              <Text style={s.totalLabel}>{c.label}</Text>
              <Text style={c.main ? s.totalMain : s.totalValue}>{fmtCurrency(c.value)}</Text>
            </View>
          ))}
        </View>

        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.th, s.colAmount]}>Monto</Text>
          <Text style={[s.th, s.colMethod]}>Método</Text>
          <Text style={[s.th, s.colPatient]}>Paciente</Text>
          <Text style={[s.th, s.colDoctor]}>Doctor</Text>
          <Text style={[s.th, s.colDate]}>Fecha pago</Text>
          <Text style={[s.th, s.colNote]}>Nota</Text>
        </View>

        {/* Rows */}
        {payments.map((p, i) => (
          <View key={p.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tdGreen, s.colAmount]}>{fmtCurrency(p.amount)}</Text>
            <Text style={[s.td, s.colMethod]}>{METHOD_LABEL[p.payment_method] || p.payment_method}</Text>
            <Text style={[s.td, s.colPatient]}>{p.patient_name || "—"}</Text>
            <Text style={[s.td, s.colDoctor]}>{p.doctor_name || "—"}</Text>
            <Text style={[s.td, s.colDate]}>{fmtDate(p.created_at)}</Text>
            <Text style={[s.td, s.colNote]}>{p.notes || "—"}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generado el {fmtDate(new Date().toISOString())} · {organization?.name}
          </Text>
          <Text style={s.footerText}
            render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

// ── One-click generate & download ────────────────────────────────────────────

export async function downloadPaymentsPDF({ payments, totals, filters, organization, logoBase64 }) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(
    <PaymentsDocument
      payments={payments}
      totals={totals}
      filters={filters}
      organization={organization}
      logoBase64={logoBase64}
    />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href    = url;
  const dateStr = filters?.from ? `_${filters.from}_${filters.to || "hoy"}` : "";
  a.download = `pagos${dateStr}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Export Button (legacy, kept for compatibility) ────────────────────────────

export default function DownloadPaymentsPDF({ payments, totals, filters, organization, logoBase64, disabled }) {
  if (!payments) return null;

  const brand = organization?.primary_color || "#2563eb";
  const dateStr = filters?.from ? `_${filters.from}_${filters.to || "hoy"}` : "";
  const fileName = `pagos${dateStr}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <PaymentsDocument
          payments={payments}
          totals={totals}
          filters={filters}
          organization={organization}
          logoBase64={logoBase64}
        />
      }
      fileName={fileName}
    >
      {({ loading: pdfLoading }) => (
        <button
          disabled={disabled || pdfLoading}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: disabled || pdfLoading ? "#f1f5f9" : "#ffffff",
            color: disabled || pdfLoading ? "#94a3b8" : "#64748b",
            border: "1px solid #e2e8f0",
            cursor: disabled || pdfLoading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={e => {
            if (!disabled && !pdfLoading) {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.color = "#0f172a";
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = disabled || pdfLoading ? "#f1f5f9" : "#ffffff";
            e.currentTarget.style.color = disabled || pdfLoading ? "#94a3b8" : "#64748b";
          }}
        >
          {pdfLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin inline-block" />
              Preparando PDF...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
