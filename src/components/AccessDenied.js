"use client";

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="rounded-2xl p-10 text-center max-w-sm w-full"
        style={{ backgroundColor: "#ffffff", boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "1px solid #e8edf3" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
          style={{ background: "#fef2f2" }}
        >
          🔒
        </div>
        <p className="text-lg font-bold mb-2" style={{ color: "#0f172a" }}>Acceso restringido</p>
        <p className="text-sm" style={{ color: "#64748b" }}>
          No tienes permisos para ver esta sección.
        </p>
      </div>
    </div>
  );
}
