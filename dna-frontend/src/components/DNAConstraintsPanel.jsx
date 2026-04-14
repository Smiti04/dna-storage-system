import { useState, useMemo } from "react";

/* ─── Colors (DNA Vault palette) ─── */
const C = {
  lavender: "#a29bfe", lavLight: "#c4b5fd", ice: "#48dbfb", amber: "#f0932b",
  green: "#22c55e", red: "#ef4444", text: "#f0ecf8", sub: "#9a8fc0", muted: "#6b5f8a",
  card: "#12101e", border: "#2a2440", borderHov: "#3a3258", bg: "#0e0c18",
  A: "#22c55e", T: "#ef4444", G: "#f0932b", C: "#48dbfb",
};

/* ─── Tiny bar chart (pure CSS) ─── */
function MiniBar({ value, max, color, height = 8 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ width: "100%", height, background: "#1a1528", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
    </div>
  );
}

/* ─── GC Profile sparkline (SVG) ─── */
function GCProfileChart({ data, width = 400, height = 80 }) {
  if (!data || data.length < 2) return <div style={{ color: C.muted, fontSize: 12 }}>Not enough data for profile</div>;

  const maxPos = Math.max(...data.map(d => d.position));
  const padX = 30, padY = 12;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const points = data.map(d => {
    const x = padX + (maxPos > 0 ? (d.position / maxPos) * w : 0);
    const y = padY + h - (d.gc * h);
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `${padX},${padY + h} ${points} ${padX + w},${padY + h}`;

  // Ideal zone (35%–65%)
  const y65 = padY + h - (0.65 * h);
  const y35 = padY + h - (0.35 * h);
  const y50 = padY + h - (0.50 * h);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: width, height: "auto" }}>
      {/* Ideal zone band */}
      <rect x={padX} y={y65} width={w} height={y35 - y65} fill={C.green} opacity={0.07} rx={2} />
      {/* 50% line */}
      <line x1={padX} y1={y50} x2={padX + w} y2={y50} stroke={C.green} strokeWidth={0.5} strokeDasharray="4 3" opacity={0.4} />
      {/* Area fill */}
      <polygon points={areaPoints} fill={C.lavender} opacity={0.12} />
      {/* Line */}
      <polyline points={points} fill="none" stroke={C.lavender} strokeWidth={1.5} strokeLinejoin="round" />
      {/* Y axis labels */}
      <text x={padX - 4} y={y65 + 3} fill={C.muted} fontSize={8} textAnchor="end">65%</text>
      <text x={padX - 4} y={y50 + 3} fill={C.muted} fontSize={8} textAnchor="end">50%</text>
      <text x={padX - 4} y={y35 + 3} fill={C.muted} fontSize={8} textAnchor="end">35%</text>
      {/* X label */}
      <text x={padX + w / 2} y={height - 1} fill={C.muted} fontSize={8} textAnchor="middle">Position</text>
    </svg>
  );
}

/* ─── Base distribution donut ─── */
function BaseDonut({ dist, size = 100 }) {
  const bases = ["A", "T", "G", "C"];
  const colors = { A: C.A, T: C.T, G: C.G, C: C.C };
  const total = bases.reduce((s, b) => s + (dist[b]?.count || 0), 0) || 1;
  const radius = 36, cx = size / 2, cy = size / 2, strokeW = 12;

  let cumAngle = -90;
  const arcs = bases.map(b => {
    const pct = (dist[b]?.count || 0) / total;
    const angle = pct * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const largeArc = angle > 180 ? 1 : 0;
    const rad = Math.PI / 180;
    const x1 = cx + radius * Math.cos(startAngle * rad);
    const y1 = cy + radius * Math.sin(startAngle * rad);
    const x2 = cx + radius * Math.cos(endAngle * rad);
    const y2 = cy + radius * Math.sin(endAngle * rad);
    return { base: b, d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`, color: colors[b], pct };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map(a => a.pct > 0 && (
          <path key={a.base} d={a.d} fill="none" stroke={a.color} strokeWidth={strokeW} strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {bases.map(b => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[b], flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: C.text, fontWeight: 600 }}>{b}</span>
            <span style={{ fontSize: 12, color: C.sub }}>{dist[b]?.percent || 0}%</span>
            <span style={{ fontSize: 11, color: C.muted }}>({dist[b]?.count || 0})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Status badge ─── */
function Badge({ pass, label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px",
      borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px",
      background: pass ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
      color: pass ? C.green : C.red, border: `1px solid ${pass ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
    }}>
      {pass ? "✓" : "✗"} {label}
    </span>
  );
}

/* ─── Metric card ─── */
function MetricCard({ title, value, unit, pass, children }) {
  return (
    <div style={{
      flex: "1 1 200px", padding: 16, background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 8, borderLeft: `3px solid ${pass ? C.green : C.red}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</span>
        <Badge pass={pass} label={pass ? "PASS" : "FAIL"} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: pass ? C.green : C.red, fontFamily: "var(--font-mono)" }}>
        {value}<span style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginLeft: 4 }}>{unit}</span>
      </div>
      {children}
    </div>
  );
}

/* ─── Section header ─── */
function SectionLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10, marginTop: 20 }}>{children}</div>;
}

/* ═══════ MAIN PANEL ═══════ */
export default function DNAConstraintsPanel({ data }) {
  const [expandedFrag, setExpandedFrag] = useState(null);

  if (!data) return null;

  // data can be a single analysis or { summary, fragments }
  const isBatch = !!data.summary;
  const summary = isBatch ? data.summary : null;
  const fragments = isBatch ? data.fragments : null;
  const single = !isBatch ? data : null;

  const sectionStyle = { fontSize: 12, fontWeight: 700, color: C.sub, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 };

  return (
    <div>
      {/* ── Summary bar (batch mode) ── */}
      {summary && (
        <div className="card" style={{ marginBottom: 16, borderLeft: `3px solid ${summary.pass_rate === 100 ? C.green : summary.pass_rate > 50 ? C.amber : C.red}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Constraint Analysis</div>
              <div style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>
                {summary.total_fragments} fragments • {summary.encoding_type} encoding
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", color: summary.pass_rate === 100 ? C.green : summary.pass_rate > 50 ? C.amber : C.red }}>
                {summary.pass_rate}%
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>PASS RATE</div>
            </div>
          </div>
          <MiniBar value={summary.pass_rate} max={100} color={summary.pass_rate === 100 ? C.green : summary.pass_rate > 50 ? C.amber : C.red} height={6} />

          {/* Summary stats row */}
          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            {[
              ["Avg GC", `${summary.avg_gc_percent}%`, C.lavender],
              ["Avg Tm", `${summary.avg_melting_temp}°C`, C.ice],
              ["Homopolymers", summary.total_homopolymers, C.amber],
              ["Restriction sites", summary.total_restriction_sites, summary.total_restriction_sites > 0 ? C.red : C.green],
            ].map(([lbl, val, col]) => (
              <div key={lbl} style={{ flex: "1 1 100px" }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginBottom: 2 }}>{lbl}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: col, fontFamily: "var(--font-mono)" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Single analysis or selected fragment detail ── */}
      {(() => {
        const d = single || (expandedFrag !== null && fragments ? fragments[expandedFrag] : null);
        if (!d) return null;

        return (
          <div>
            <SectionLabel>Core Metrics</SectionLabel>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
              <MetricCard title="GC Content" value={d.gc_content.percent} unit="%" pass={d.gc_content.pass}>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Target: {d.gc_content.range}</div>
              </MetricCard>
              <MetricCard title="Max Homopolymer" value={d.homopolymers.max_run} unit="bp" pass={d.homopolymers.pass}>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{d.homopolymers.count} runs found (≥3bp)</div>
              </MetricCard>
              <MetricCard title="Melting Temp" value={d.melting_temp.value_c} unit="°C" pass={d.melting_temp.pass}>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Target: {d.melting_temp.range}</div>
              </MetricCard>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MetricCard title="Restriction Sites" value={d.restriction_sites.count} unit="found" pass={d.restriction_sites.pass}>
                {d.restriction_sites.found.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {d.restriction_sites.found.slice(0, 6).map((s, i) => (
                      <span key={i} style={{ fontSize: 10, fontFamily: "var(--font-mono)", padding: "2px 6px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 3, color: C.red }}>
                        {s.enzyme} @{s.position}
                      </span>
                    ))}
                  </div>
                )}
              </MetricCard>
              <MetricCard title="Complexity" value={d.complexity.value} unit="" pass={d.complexity.pass}>
                <MiniBar value={d.complexity.value} max={1} color={d.complexity.pass ? C.lavender : C.red} height={6} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>K-mer diversity (≥0.5 = good)</div>
              </MetricCard>
            </div>

            {/* ── GC Profile Chart ── */}
            {d.gc_profile && d.gc_profile.length > 1 && (
              <>
                <SectionLabel>GC Content Profile</SectionLabel>
                <div className="card" style={{ padding: 14 }}>
                  <GCProfileChart data={d.gc_profile} width={460} height={90} />
                  <div style={{ display: "flex", gap: 12, marginTop: 8, justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: C.green, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 16, height: 2, background: C.green, opacity: 0.5, display: "inline-block" }} /> Ideal zone
                    </span>
                    <span style={{ fontSize: 10, color: C.lavender, display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 16, height: 2, background: C.lavender, display: "inline-block" }} /> Actual GC
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ── Base Distribution ── */}
            <SectionLabel>Base Distribution</SectionLabel>
            <div className="card" style={{ padding: 14 }}>
              <BaseDonut dist={d.base_distribution} size={100} />
            </div>

            {/* ── Homopolymer details ── */}
            {d.homopolymers.details && d.homopolymers.details.length > 0 && (
              <>
                <SectionLabel>Homopolymer Runs</SectionLabel>
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        {["Base", "Length", "Position"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: C.sub, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.homopolymers.details.map((h, i) => (
                        <tr key={i} style={{ borderBottom: i < d.homopolymers.details.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <td style={{ padding: "6px 12px", fontFamily: "var(--font-mono)", color: C[h.base] || C.text, fontWeight: 700 }}>{h.base.repeat(h.length)}</td>
                          <td style={{ padding: "6px 12px", fontFamily: "var(--font-mono)", color: h.length > 3 ? C.red : C.amber }}>{h.length}</td>
                          <td style={{ padding: "6px 12px", fontFamily: "var(--font-mono)", color: C.muted }}>{h.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Fragment list (batch mode) ── */}
      {fragments && fragments.length > 0 && (
        <>
          <SectionLabel>Per-Fragment Analysis</SectionLabel>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {fragments.map((f, i) => {
              const isOpen = expandedFrag === i;
              return (
                <div key={i} style={{ borderBottom: i < fragments.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <button
                    onClick={() => setExpandedFrag(isOpen ? null : i)}
                    style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", background: isOpen ? "#1a1528" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                    }}
                    onMouseOver={e => { if (!isOpen) e.currentTarget.style.background = "#14121f"; }}
                    onMouseOut={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: C.muted, fontWeight: 600 }}>#{i}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{f.length} bp</span>
                      <span style={{ fontSize: 12, color: C.sub }}>GC {f.gc_content.percent}%</span>
                      <span style={{ fontSize: 12, color: C.sub }}>Tm {f.melting_temp.value_c}°C</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge pass={f.overall_pass} label={f.overall_pass ? "PASS" : "FAIL"} />
                      <span style={{ color: C.muted, fontSize: 14, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
