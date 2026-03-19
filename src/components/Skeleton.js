// Reusable skeleton loader components using Tailwind animate-pulse

function Bar({ w = "100%", h = 14, rounded = 8, className = "" }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ width: w, height: h, borderRadius: rounded, backgroundColor: "#e2e8f0" }}
    />
  );
}

// ── Table skeleton ─────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
      {/* Header */}
      <div className="flex gap-4 px-5 py-3.5" style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Bar key={i} w={i === 0 ? 80 : `${Math.floor(100 / cols)}%`} h={10} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 items-center px-5 py-4"
          style={{ borderBottom: ri < rows - 1 ? "1px solid #f1f5f9" : "none" }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <Bar key={ci}
              w={ci === 0 ? "10%" : ci === cols - 1 ? "8%" : `${Math.floor(75 / (cols - 2))}%`}
              h={ci === 0 ? 32 : 12}
              rounded={ci === 0 ? 20 : 6}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Card grid skeleton ─────────────────────────────────────────────────────────

export function CardGridSkeleton({ cards = 6, cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={`grid ${cols} gap-5`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 space-y-4 animate-pulse"
          style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: "#e2e8f0" }} />
            <div className="flex-1 space-y-2">
              <Bar w="60%" h={12} />
              <Bar w="40%" h={10} />
            </div>
          </div>
          <div className="space-y-2">
            <Bar w="80%" h={10} />
            <Bar w="55%" h={10} />
          </div>
          <div className="flex gap-2 pt-1">
            <Bar w={80} h={30} rounded={8} />
            <Bar w={80} h={30} rounded={8} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Detail skeleton ────────────────────────────────────────────────────────────

export function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bar w={80} h={34} rounded={8} />
          <div className="space-y-2">
            <Bar w={200} h={20} />
            <Bar w={140} h={12} />
          </div>
        </div>
        <Bar w={120} h={36} rounded={8} />
      </div>
      {/* Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
            <Bar w="50%" h={10} />
            <Bar w="70%" h={14} />
          </div>
        ))}
      </div>
      {/* Content block */}
      <div className="rounded-xl p-6 space-y-3" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
        <Bar w="30%" h={12} />
        <Bar w="100%" h={12} />
        <Bar w="85%" h={12} />
        <Bar w="90%" h={12} />
      </div>
    </div>
  );
}
