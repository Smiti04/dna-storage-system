import { useState } from "react";

// Mini bar component
function Bar({ value, max, color, width = 200 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width, height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{value}</span>
    </div>
  );
}

// GC meter
function GCMeter({ value }) {
  const inRange = value >= 45 && value <= 55;
  const color = inRange ? "var(--neon-green)" : value < 40 || value > 60 ? "#ef4444" : "#f59e0b";
  const pct = Math.min(Math.max(value, 0), 100);

  return (
    <div>
      <div style={{ position: "relative", height: "18px", background: "var(--bg-secondary)", borderRadius: "9px", overflow: "hidden", marginBottom: "6px" }}>
        {/* Target zone 45-55% */}
        <div style={{ position: "absolute", left: "45%", width: "10%", height: "100%", background: "rgba(0,255,136,0.15)", borderLeft: "1px solid rgba(0,255,136,0.4)", borderRight: "1px solid rgba(0,255,136,0.4)" }} />
        {/* Actual value */}
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: color, opacity: 0.8, borderRadius: "9px", transition: "width 0.5s ease" }} />
        {/* Pointer */}
        <div style={{ position: "absolute", left: `calc(${pct}% - 1px)`, top: 0, width: "2px", height: "100%", background: "#fff" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
        <span>0%</span>
        <span style={{ color: "rgba(0,255,136,0.6)" }}>45–55% target</span>
        <span>100%</span>
      </div>
    </div>
  );
}

// Pass/fail badge
function Badge({ pass }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "4px", fontSize: "10px",
      fontFamily: "var(--font-mono)", letterSpacing: "1px",
      background: pass ? "rgba(0,255,136,0.1)" : "rgba(239,68,68,0.1)",
      color: pass ? "var(--neon-green)" : "#ef4444",
      border: `1px solid ${pass ? "rgba(0,255,136,0.3)" : "rgba(239,68,68,0.3)"}`,
    }}>
      {pass ? "PASS" : "FAIL"}
    </span>
  );
}

function DNAConstraintsPanel({ data }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [expandedFrag, setExpandedFrag] = useState(null);
  const [filterMode, setFilterMode] = useState("all"); // all | pass | fail
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { summary, fragments, total_fragments, encoding_type } = data;

  const filtered = fragments.filter(f => {
    if (filterMode === "pass") return f.overall_pass;
    if (filterMode === "fail") return !f.overall_pass;
    return true;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const passRate = Math.round((summary.all_pass_count / total_fragments) * 100);

  const s = {
    panel: { marginTop: "24px" },
    sectionTitle: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "2px", marginBottom: "14px" },
    card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", marginBottom: "16px" },
    tabBtn: (active) => ({
      padding: "8px 18px", background: active ? "rgba(0,255,136,0.1)" : "transparent",
      border: `1px solid ${active ? "rgba(0,255,136,0.4)" : "var(--border)"}`,
      borderRadius: "6px", color: active ? "var(--neon-green)" : "var(--text-secondary)",
      fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "1px",
      cursor: "pointer", transition: "all 0.2s",
    }),
    filterBtn: (active, color) => ({
      padding: "5px 14px", background: active ? `${color}22` : "transparent",
      border: `1px solid ${active ? color : "var(--border)"}`,
      borderRadius: "4px", color: active ? color : "var(--text-muted)",
      fontFamily: "var(--font-mono)", fontSize: "10px", cursor: "pointer",
      transition: "all 0.2s", letterSpacing: "1px",
    }),
    statBox: (color) => ({
      flex: 1, minWidth: "120px", padding: "14px 16px",
      background: "var(--bg-secondary)", borderRadius: "8px",
      border: `1px solid ${color}33`,
    }),
    fragRow: (expanded, pass) => ({
      padding: "12px 16px", marginBottom: "6px",
      background: expanded ? "var(--bg-secondary)" : "var(--bg-primary)",
      border: `1px solid ${expanded ? "rgba(0,212,255,0.3)" : pass ? "rgba(0,255,136,0.1)" : "rgba(239,68,68,0.15)"}`,
      borderRadius: "6px", cursor: "pointer", transition: "all 0.2s",
    }),
  };

  return (
    <div style={s.panel}>
      <div style={s.sectionTitle}>🧬 DNA CONSTRAINTS ANALYSIS</div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[["summary", "SUMMARY"], ["fragments", "PER FRAGMENT"]].map(([id, label]) => (
          <button key={id} style={s.tabBtn(activeTab === id)} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ===== SUMMARY TAB ===== */}
      {activeTab === "summary" && (
        <>
          {/* Overall pass rate */}
          <div style={{ ...s.card, border: `1px solid ${passRate === 100 ? "rgba(0,255,136,0.3)" : passRate > 80 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={s.sectionTitle}>OVERALL PASS RATE</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "36px", color: passRate === 100 ? "var(--neon-green)" : passRate > 80 ? "#f59e0b" : "#ef4444" }}>
                  {passRate}%
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--neon-green)" }}>✓ {summary.all_pass_count} passed</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>✗ {summary.all_fail_count} failed</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{total_fragments} total fragments</div>
              </div>
            </div>
            {/* Pass rate bar */}
            <div style={{ height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${passRate}%`, height: "100%", background: passRate === 100 ? "var(--neon-green)" : passRate > 80 ? "#f59e0b" : "#ef4444", borderRadius: "4px", transition: "width 0.6s ease" }} />
            </div>
          </div>

          {/* Stat boxes */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            {[
              { label: "OVERALL GC%", value: `${summary.overall_gc_pct}%`, sub: "Target: 45–55%", color: summary.overall_gc_pct >= 45 && summary.overall_gc_pct <= 55 ? "var(--neon-green)" : "#ef4444" },
              { label: "GC PASS", value: summary.gc_pass_count, sub: `${summary.gc_fail_count} failed`, color: "var(--neon-green)" },
              { label: "HOMOPOLYMER PASS", value: summary.homopolymer_pass_count, sub: `${summary.homopolymer_fail_count} failed`, color: "var(--neon-blue)" },
              { label: "TOTAL VIOLATIONS", value: summary.total_violations, sub: "homopolymer runs >3", color: summary.total_violations === 0 ? "var(--neon-green)" : "#ef4444" },
              { label: "ENCODING", value: encoding_type === "6base" ? "6-BASE" : "4-BASE", sub: encoding_type === "6base" ? "5mC + 6mA" : "A T G C", color: encoding_type === "6base" ? "var(--neon-blue)" : "var(--neon-green)" },
            ].map(stat => (
              <div key={stat.label} style={s.statBox(stat.color)}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "6px" }}>{stat.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: stat.color }}>{stat.value}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* GC content meter */}
          <div style={s.card}>
            <div style={s.sectionTitle}>GC CONTENT DISTRIBUTION</div>
            <GCMeter value={summary.overall_gc_pct} />

            {/* Constraint rules */}
            <div style={{ marginTop: "20px" }}>
              <div style={s.sectionTitle}>CONSTRAINT RULES APPLIED</div>
              {[
                { rule: "GC Content", detail: "45% ≤ GC ≤ 55%", pass: summary.overall_gc_pct >= 45 && summary.overall_gc_pct <= 55 },
                { rule: "Homopolymer Runs", detail: "Max 3 consecutive identical bases", pass: summary.total_violations === 0 },
              ].map(r => (
                <div key={r.rule} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>{r.rule}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{r.detail}</div>
                  </div>
                  <Badge pass={r.pass} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== PER FRAGMENT TAB ===== */}
      {activeTab === "fragments" && (
        <>
          {/* Filter + count */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>FILTER:</span>
            {[
              ["all", "ALL", "var(--text-secondary)"],
              ["pass", "PASS ONLY", "var(--neon-green)"],
              ["fail", "FAIL ONLY", "#ef4444"],
            ].map(([id, label, color]) => (
              <button key={id} style={s.filterBtn(filterMode === id, color)}
                onClick={() => { setFilterMode(id); setPage(0); }}>
                {label}
              </button>
            ))}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
              {filtered.length} fragments
            </span>
          </div>

          {/* Fragment list */}
          {paginated.map((f) => (
            <div
              key={`${f.chunk_id}-${f.frag_index}`}
              style={s.fragRow(expandedFrag === `${f.chunk_id}-${f.frag_index}`, f.overall_pass)}
              onClick={() => setExpandedFrag(
                expandedFrag === `${f.chunk_id}-${f.frag_index}` ? null : `${f.chunk_id}-${f.frag_index}`
              )}
            >
              {/* Row header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--neon-blue)" }}>
                    CHUNK {f.chunk_id} · FRAG {f.frag_index}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    {f.length} bases
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: f.gc_pct >= 45 && f.gc_pct <= 55 ? "var(--neon-green)" : "#ef4444" }}>
                    GC {f.gc_pct}%
                  </span>
                  <Badge pass={f.overall_pass} />
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                    {expandedFrag === `${f.chunk_id}-${f.frag_index}` ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedFrag === `${f.chunk_id}-${f.frag_index}` && (
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                    {/* GC Content */}
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px" }}>
                        GC CONTENT <Badge pass={f.gc_pass} />
                      </div>
                      <GCMeter value={f.gc_pct} />
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: f.gc_pass ? "var(--neon-green)" : "#ef4444", marginTop: "6px" }}>
                        {f.gc_pct}% {f.gc_pass ? "— within target range" : "— outside 45–55% range"}
                      </div>
                    </div>

                    {/* Homopolymer */}
                    <div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px" }}>
                        HOMOPOLYMER RUNS <Badge pass={f.homopolymer_pass} />
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)", marginBottom: "6px" }}>
                        Max run: <span style={{ color: f.max_homopolymer_run > 3 ? "#ef4444" : "var(--neon-green)" }}>{f.max_homopolymer_run}</span>
                        <span style={{ color: "var(--text-muted)" }}> (limit: 3)</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-primary)" }}>
                        Violations: <span style={{ color: f.homopolymer_violations > 0 ? "#ef4444" : "var(--neon-green)" }}>{f.homopolymer_violations}</span>
                      </div>
                    </div>
                  </div>

                  {/* Base composition bars */}
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "10px" }}>BASE COMPOSITION</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {Object.entries(f.base_counts).map(([base, count]) => {
                        const baseColors = { A: "#60a5fa", T: "#f87171", G: "var(--neon-green)", C: "#a78bfa", M: "#f59e0b", X: "var(--neon-blue)" };
                        return (
                          <div key={base} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: baseColors[base] || "var(--text-secondary)", width: "20px" }}>{base}</span>
                            <Bar value={count} max={f.length} color={baseColors[base] || "#888"} width={160} />
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                              {((count / f.length) * 100).toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
              <button
                style={s.filterBtn(false, "var(--text-secondary)")}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ← PREV
              </button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", padding: "6px 12px" }}>
                {page + 1} / {totalPages}
              </span>
              <button
                style={s.filterBtn(false, "var(--text-secondary)")}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                NEXT →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DNAConstraintsPanel;