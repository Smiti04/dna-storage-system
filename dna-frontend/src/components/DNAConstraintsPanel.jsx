import { useState } from "react";

function Bar({ value, max, color, width = 180 }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ width, height: "5px", background: "#1e1a2e", borderRadius: "3px", overflow: "hidden", flexShrink: 0 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.4s" }} />
    </div>
    <span style={{ fontSize: "11px", color: "#5a5078" }}>{value}</span>
  </div>;
}

function GCMeter({ value }) {
  const ok = value >= 45 && value <= 55;
  const color = ok ? "#22c55e" : value < 40 || value > 60 ? "#ef4444" : "#f0932b";
  const pct = Math.min(Math.max(value, 0), 100);
  return <div>
    <div style={{ position: "relative", height: "14px", background: "#1e1a2e", borderRadius: "7px", overflow: "hidden", marginBottom: "5px" }}>
      <div style={{ position: "absolute", left: "45%", width: "10%", height: "100%", background: "rgba(34,197,94,0.15)", borderLeft: "1px solid rgba(34,197,94,0.3)", borderRight: "1px solid rgba(34,197,94,0.3)" }} />
      <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: color, opacity: 0.7, borderRadius: "7px", transition: "width 0.5s" }} />
      <div style={{ position: "absolute", left: `calc(${pct}% - 1px)`, top: 0, width: "2px", height: "100%", background: "#e0daf0" }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#3a3458" }}><span>0%</span><span style={{ color: "#22c55e" }}>45–55%</span><span>100%</span></div>
  </div>;
}

function Badge({ pass }) {
  return <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "500", background: pass ? "#0a1a12" : "#1a0a0a", color: pass ? "#22c55e" : "#ef4444" }}>{pass ? "Pass" : "Fail"}</span>;
}

function DNAConstraintsPanel({ data }) {
  const [tab, setTab] = useState("summary");
  const [expFrag, setExpFrag] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PS = 10;
  const { summary, fragments, total_fragments, encoding_type } = data;
  const filtered = fragments.filter(f => { if (filter === "pass") return f.overall_pass; if (filter === "fail") return !f.overall_pass; return true; });
  const paged = filtered.slice(page * PS, (page + 1) * PS);
  const tp = Math.ceil(filtered.length / PS);
  const pr = Math.round((summary.all_pass_count / total_fragments) * 100);

  const tbtn = (a) => ({ padding: "7px 16px", background: a ? "#a29bfe" : "transparent", border: `1px solid ${a ? "#a29bfe" : "#1e1a2e"}`, borderRadius: "5px", color: a ? "#0a0912" : "#5a5078", fontSize: "12px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" });
  const fbtn = (a, c) => ({ padding: "4px 12px", background: a ? `${c}18` : "transparent", border: `1px solid ${a ? c : "#1e1a2e"}`, borderRadius: "5px", color: a ? c : "#3a3458", fontSize: "11px", fontWeight: "500", cursor: "pointer", transition: "all 0.15s" });

  return (
    <div style={{ marginTop: "24px" }}>
      <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>DNA Constraints Analysis</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {[["summary", "Summary"], ["fragments", "Per Fragment"]].map(([id, l]) => <button key={id} style={tbtn(tab === id)} onClick={() => setTab(id)}>{l}</button>)}
      </div>

      {tab === "summary" && <>
        <div className="card" style={{ border: `1px solid ${pr === 100 ? "rgba(34,197,94,0.2)" : pr > 80 ? "rgba(240,147,43,0.2)" : "rgba(239,68,68,0.2)"}`, marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Overall pass rate</div>
              <div style={{ fontSize: "32px", fontWeight: "600", color: pr === 100 ? "#22c55e" : pr > 80 ? "#f0932b" : "#ef4444" }}>{pr}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", color: "#22c55e" }}>✓ {summary.all_pass_count} passed</div>
              <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "3px" }}>✗ {summary.all_fail_count} failed</div>
              <div style={{ fontSize: "11px", color: "#3a3458", marginTop: "3px" }}>{total_fragments} total</div>
            </div>
          </div>
          <div style={{ height: "6px", background: "#1e1a2e", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: `${pr}%`, height: "100%", background: pr === 100 ? "#22c55e" : pr > 80 ? "#f0932b" : "#ef4444", borderRadius: "3px", transition: "width 0.6s" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
          {[["Overall GC%", `${summary.overall_gc_pct}%`, `${summary.gc_fail_count} failed`, summary.overall_gc_pct >= 45 && summary.overall_gc_pct <= 55 ? "#22c55e" : "#ef4444"],
            ["GC Pass", summary.gc_pass_count, `${summary.gc_fail_count} failed`, "#a29bfe"],
            ["Homopolymer Pass", summary.homopolymer_pass_count, `${summary.homopolymer_fail_count} failed`, "#48dbfb"]
          ].map(([l, v, s, c]) => <div key={l} className="card" style={{ flex: 1, minWidth: "130px" }}>
            <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{l}</div>
            <div style={{ fontSize: "22px", fontWeight: "600", color: c }}>{v}</div>
            <div style={{ fontSize: "11px", color: "#3a3458", marginTop: "2px" }}>{s}</div>
          </div>)}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", marginBottom: "6px" }}>Total violations</div>
            <div style={{ fontSize: "22px", fontWeight: "600", color: "#ef4444" }}>{summary.total_violations}</div>
            <div style={{ fontSize: "11px", color: "#3a3458" }}>homopolymer runs &gt;3</div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", marginBottom: "6px" }}>Encoding</div>
            <div style={{ fontSize: "22px", fontWeight: "600", color: "#f0932b" }}>{encoding_type === "6base" ? "6-Base" : "4-Base"}</div>
            <div style={{ fontSize: "11px", color: "#3a3458" }}>{encoding_type === "6base" ? "A T G C M X" : "A T G C"}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>GC Distribution</div>
          <GCMeter value={summary.overall_gc_pct} />
        </div>

        <div className="card">
          <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Constraint Rules</div>
          {[{ rule: "GC Content", detail: "45% ≤ GC ≤ 55%", pass: summary.gc_fail_count === 0 }, { rule: "Homopolymer Runs", detail: "Max 3 consecutive identical bases", pass: summary.homopolymer_fail_count === 0 }].map(r =>
            <div key={r.rule} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e1a2e" }}>
              <div><div style={{ fontSize: "13px", fontWeight: "500", color: "#e0daf0" }}>{r.rule}</div><div style={{ fontSize: "11px", color: "#3a3458", marginTop: "1px" }}>{r.detail}</div></div>
              <Badge pass={r.pass} />
            </div>
          )}
        </div>
      </>}

      {tab === "fragments" && <>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "#3a3458" }}>Filter:</span>
          {[["all", "All", "#5a5078"], ["pass", "Pass", "#22c55e"], ["fail", "Fail", "#ef4444"]].map(([id, l, c]) =>
            <button key={id} style={fbtn(filter === id, c)} onClick={() => { setFilter(id); setPage(0); }}>{l}</button>
          )}
          <span style={{ fontSize: "11px", color: "#3a3458", marginLeft: "6px" }}>{filtered.length} fragments</span>
        </div>

        {paged.map(f => {
          const k = `${f.chunk_id}-${f.frag_index}`;
          return <div key={k} style={{ background: expFrag === k ? "#16132a" : "#12101e", border: `1px solid ${expFrag === k ? "#a29bfe33" : f.overall_pass ? "#1e1a2e" : "rgba(239,68,68,0.15)"}`, borderRadius: "6px", padding: "10px 14px", marginBottom: "5px", cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => setExpFrag(expFrag === k ? null : k)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#48dbfb" }}>Chunk {f.chunk_id} · Frag {f.frag_index}</span>
                <span style={{ fontSize: "11px", color: "#3a3458" }}>{f.length} bases</span>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "500", color: f.gc_pct >= 45 && f.gc_pct <= 55 ? "#22c55e" : "#ef4444" }}>GC {f.gc_pct}%</span>
                <Badge pass={f.overall_pass} />
                <span style={{ fontSize: "9px", color: "#3a3458" }}>{expFrag === k ? "▲" : "▼"}</span>
              </div>
            </div>
            {expFrag === k && <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #1e1a2e" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", marginBottom: "6px" }}>GC Content <Badge pass={f.gc_pass} /></div>
                  <GCMeter value={f.gc_pct} />
                  <div style={{ fontSize: "11px", color: f.gc_pass ? "#22c55e" : "#ef4444", marginTop: "4px" }}>{f.gc_pct}% {f.gc_pass ? "— in range" : "— out of range"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", marginBottom: "6px" }}>Homopolymer <Badge pass={f.homopolymer_pass} /></div>
                  <div style={{ fontSize: "12px", color: "#e0daf0", marginBottom: "3px" }}>Max run: <span style={{ color: f.max_homopolymer_run > 3 ? "#ef4444" : "#22c55e", fontWeight: "500" }}>{f.max_homopolymer_run}</span> <span style={{ color: "#3a3458" }}>(limit: 3)</span></div>
                  <div style={{ fontSize: "12px", color: "#e0daf0" }}>Violations: <span style={{ color: f.homopolymer_violations > 0 ? "#ef4444" : "#22c55e", fontWeight: "500" }}>{f.homopolymer_violations}</span></div>
                </div>
              </div>
              <div style={{ marginTop: "14px" }}>
                <div style={{ fontSize: "10px", color: "#3a3458", textTransform: "uppercase", marginBottom: "8px" }}>Base Composition</div>
                {Object.entries(f.base_counts).map(([base, count]) => {
                  const cs = { A: "#a29bfe", T: "#ef4444", G: "#22c55e", C: "#48dbfb", M: "#f0932b", X: "#48dbfb" };
                  return <div key={base} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: cs[base], width: "16px", fontFamily: "var(--font-mono)", fontWeight: "500" }}>{base}</span>
                    <Bar value={count} max={f.length} color={cs[base]} width={140} />
                    <span style={{ fontSize: "10px", color: "#3a3458" }}>{((count / f.length) * 100).toFixed(1)}%</span>
                  </div>;
                })}
              </div>
            </div>}
          </div>;
        })}

        {tp > 1 && <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "14px" }}>
          <button style={fbtn(false, "#5a5078")} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
          <span style={{ fontSize: "12px", color: "#3a3458", padding: "5px 10px" }}>{page + 1} / {tp}</span>
          <button style={fbtn(false, "#5a5078")} onClick={() => setPage(p => Math.min(tp - 1, p + 1))} disabled={page === tp - 1}>Next →</button>
        </div>}
      </>}
    </div>
  );
}

export default DNAConstraintsPanel;
