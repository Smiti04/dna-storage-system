import { useState } from "react";

function Bar({ value, max, color, width = 200 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width, height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: "12px", color: "#64748b" }}>{value}</span>
    </div>
  );
}

function GCMeter({ value }) {
  const inRange = value >= 45 && value <= 55;
  const color = inRange ? "#22c55e" : value < 40 || value > 60 ? "#ef4444" : "#f59e0b";
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div>
      <div style={{ position: "relative", height: "16px", background: "#f1f5f9", borderRadius: "8px", overflow: "hidden", marginBottom: "6px" }}>
        <div style={{ position: "absolute", left: "45%", width: "10%", height: "100%", background: "rgba(34,197,94,0.15)", borderLeft: "1px solid rgba(34,197,94,0.4)", borderRight: "1px solid rgba(34,197,94,0.4)" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: color, opacity: 0.7, borderRadius: "8px", transition: "width 0.5s ease" }} />
        <div style={{ position: "absolute", left: `calc(${pct}% - 1px)`, top: 0, width: "2px", height: "100%", background: "#0f172a" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8" }}>
        <span>0%</span><span style={{ color: "#16a34a" }}>45–55% target</span><span>100%</span>
      </div>
    </div>
  );
}

function Badge({ pass }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600",
      background: pass ? "#f0fdf4" : "#fef2f2",
      color: pass ? "#16a34a" : "#ef4444",
    }}>
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function DNAConstraintsPanel({ data }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [expandedFrag, setExpandedFrag] = useState(null);
  const [filterMode, setFilterMode] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { summary, fragments, total_fragments, encoding_type } = data;
  const filtered = fragments.filter(f => { if (filterMode === "pass") return f.overall_pass; if (filterMode === "fail") return !f.overall_pass; return true; });
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const passRate = Math.round((summary.all_pass_count / total_fragments) * 100);

  const tabBtn = (active) => ({ padding: "8px 18px", background: active ? "#2563eb" : "transparent", border: `1px solid ${active ? "#2563eb" : "#e2e8f0"}`, borderRadius: "6px", color: active ? "#fff" : "#64748b", fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" });
  const filterBtn = (active, color) => ({ padding: "5px 14px", background: active ? `${color}15` : "transparent", border: `1px solid ${active ? color : "#e2e8f0"}`, borderRadius: "6px", color: active ? color : "#94a3b8", fontSize: "12px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" });

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "14px", textTransform: "uppercase" }}>DNA Constraints Analysis</div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[["summary", "Summary"], ["fragments", "Per Fragment"]].map(([id, label]) => (
          <button key={id} style={tabBtn(activeTab === id)} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      {activeTab === "summary" && (
        <>
          <div className="card" style={{ border: `1px solid ${passRate === 100 ? "#dcfce7" : passRate > 80 ? "#fef3c7" : "#fee2e2"}`, marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Overall Pass Rate</div>
                <div style={{ fontSize: "36px", fontWeight: "700", color: passRate === 100 ? "#16a34a" : passRate > 80 ? "#f59e0b" : "#ef4444" }}>{passRate}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: "500" }}>✓ {summary.all_pass_count} passed</div>
                <div style={{ fontSize: "13px", color: "#ef4444", fontWeight: "500", marginTop: "4px" }}>✗ {summary.all_fail_count} failed</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{total_fragments} total fragments</div>
              </div>
            </div>
            <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${passRate}%`, height: "100%", background: passRate === 100 ? "#22c55e" : passRate > 80 ? "#f59e0b" : "#ef4444", borderRadius: "4px", transition: "width 0.6s ease" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            {[
              { label: "Overall GC%", value: `${summary.overall_gc_pct}%`, sub: "Target: 45–55%", color: summary.overall_gc_pct >= 45 && summary.overall_gc_pct <= 55 ? "#16a34a" : "#ef4444" },
              { label: "GC Pass", value: summary.gc_pass_count, sub: `${summary.gc_fail_count} failed`, color: "#16a34a" },
              { label: "Homopolymer Pass", value: summary.homopolymer_pass_count, sub: `${summary.homopolymer_fail_count} failed`, color: "#2563eb" },
            ].map((s) => (
              <div key={s.label} className="card" style={{ flex: 1, minWidth: "140px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{s.label}</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div className="card" style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Total Violations</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#ef4444" }}>{summary.total_violations}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>homopolymer runs &gt;3</div>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Encoding</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#2563eb" }}>{encoding_type === "6base" ? "6-Base" : "4-Base"}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{encoding_type === "6base" ? "A T G C M X" : "A T G C"}</div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>GC Content Distribution</div>
            <GCMeter value={summary.overall_gc_pct} />
          </div>

          <div className="card" style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" }}>Constraint Rules</div>
            {[
              { rule: "GC Content", detail: "45% ≤ GC ≤ 55%", pass: summary.gc_fail_count === 0 },
              { rule: "Homopolymer Runs", detail: "Max 3 consecutive identical bases", pass: summary.homopolymer_fail_count === 0 },
            ].map(r => (
              <div key={r.rule} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{r.rule}</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{r.detail}</div>
                </div>
                <Badge pass={r.pass} />
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "fragments" && (
        <>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500" }}>Filter:</span>
            {[["all", "All", "#64748b"], ["pass", "Pass only", "#16a34a"], ["fail", "Fail only", "#ef4444"]].map(([id, label, color]) => (
              <button key={id} style={filterBtn(filterMode === id, color)} onClick={() => { setFilterMode(id); setPage(0); }}>{label}</button>
            ))}
            <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "8px" }}>{filtered.length} fragments</span>
          </div>

          {paginated.map((f) => (
            <div key={`${f.chunk_id}-${f.frag_index}`}
              style={{ background: expandedFrag === `${f.chunk_id}-${f.frag_index}` ? "#f8fafc" : "#fff", border: `1px solid ${expandedFrag === `${f.chunk_id}-${f.frag_index}` ? "#2563eb30" : f.overall_pass ? "#e2e8f0" : "#fee2e2"}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "6px", cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => setExpandedFrag(expandedFrag === `${f.chunk_id}-${f.frag_index}` ? null : `${f.chunk_id}-${f.frag_index}`)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "500" }}>Chunk {f.chunk_id} · Frag {f.frag_index}</span>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>{f.length} bases</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: "500", color: f.gc_pct >= 45 && f.gc_pct <= 55 ? "#16a34a" : "#ef4444" }}>GC {f.gc_pct}%</span>
                  <Badge pass={f.overall_pass} />
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>{expandedFrag === `${f.chunk_id}-${f.frag_index}` ? "▲" : "▼"}</span>
                </div>
              </div>

              {expandedFrag === `${f.chunk_id}-${f.frag_index}` && (
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>GC Content <Badge pass={f.gc_pass} /></div>
                      <GCMeter value={f.gc_pct} />
                      <div style={{ fontSize: "12px", color: f.gc_pass ? "#16a34a" : "#ef4444", marginTop: "6px" }}>{f.gc_pct}% {f.gc_pass ? "— within range" : "— outside range"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>Homopolymer Runs <Badge pass={f.homopolymer_pass} /></div>
                      <div style={{ fontSize: "13px", color: "#0f172a", marginBottom: "4px" }}>Max run: <span style={{ color: f.max_homopolymer_run > 3 ? "#ef4444" : "#16a34a", fontWeight: "600" }}>{f.max_homopolymer_run}</span> <span style={{ color: "#94a3b8" }}>(limit: 3)</span></div>
                      <div style={{ fontSize: "13px", color: "#0f172a" }}>Violations: <span style={{ color: f.homopolymer_violations > 0 ? "#ef4444" : "#16a34a", fontWeight: "600" }}>{f.homopolymer_violations}</span></div>
                    </div>
                  </div>
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>Base Composition</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {Object.entries(f.base_counts).map(([base, count]) => {
                        const colors = { A: "#3b82f6", T: "#ef4444", G: "#22c55e", C: "#8b5cf6", M: "#f59e0b", X: "#06b6d4" };
                        return (
                          <div key={base} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "12px", color: colors[base], width: "20px", fontWeight: "600", fontFamily: "var(--font-mono)" }}>{base}</span>
                            <Bar value={count} max={f.length} color={colors[base]} width={160} />
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{((count / f.length) * 100).toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
              <button style={filterBtn(false, "#64748b")} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
              <span style={{ fontSize: "13px", color: "#94a3b8", padding: "6px 12px" }}>{page + 1} / {totalPages}</span>
              <button style={filterBtn(false, "#64748b")} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DNAConstraintsPanel;
